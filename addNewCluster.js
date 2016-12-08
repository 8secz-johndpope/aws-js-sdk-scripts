#!/usr/bin/env node

let AWS = require('aws-sdk');
let awsUtil = require('./lib/awsUtil');

AWS.config.update({region: 'us-east-1'});

let envConfig = require('./profile/envConfig');

let args = process.argv.slice(2);
//the first argument should be the notify email;
let notifyEmail = args[0];

const RC_CLUSTER_NAME = envConfig.shared.clusterName;

let envParams = {};

Promise.all([awsUtil.getStartingOrActiveClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then(
		(values) => {
			let clusterId = values[0];
			let bucketName = values[1];
			if (clusterId) {
				console.log(`Cluster ${RC_CLUSTER_NAME} already exist! Quit`);
			}
			else {
				const env = awsUtil.getEnvFromBucketName(bucketName);
				envParams = require('./profile/envConfig')[env];
				return awsUtil.createCluster(envParams);
			}
		}).then(
		(newClusterId) => {
			if (newClusterId) {
				console.log(`New cluster created, ID: ${newClusterId}`);
				sendBeginEmail(newClusterId);
				//we wait for MAX 30 minutes for cluster to startup
				let remainingWaitTime = 1800000;
				let WAIT_INTERVAL = 30000;
				let waitCluster = setInterval(() => {
					awsUtil.getClusterState(newClusterId).then((state) => {
						remainingWaitTime -= WAIT_INTERVAL;
						if (remainingWaitTime <= 0) {
							clearInterval(waitCluster);
							console.log('Max timeout reached, quit....');
						}else {
							if (state && state === 'WAITING') {
								clearInterval(waitCluster);
								console.log(`Cluster Ready, trying to get Master instance ID for ${newClusterId}`);
								//attach ELB
								awsUtil.getEmrMaster(newClusterId).then((masterId) => {
									console.log(`retrieved Master instance ID: ${masterId}. Start to bind to elb: ${envParams.elbName}`);
									awsUtil.regElbInstance(masterId, envParams.elbName);
								});
								let fileLocation = envParams.RcS3StageDir + '/RC/' + envParams.env + '/hive-scripts/startHive.sh';
								awsUtil.addShellStep(newClusterId, fileLocation, 'Start Hive Server2');
							}
							else {
								console.log(`Current state is: ${state}, waiting another 30s for cluster ${newClusterId} to be Ready...`);
							}
						}
					})
				}, WAIT_INTERVAL);
			}
		});


function sendBeginEmail(clusterId) {
	const exec = require('child_process').exec;
	let mailxCMD = `echo clusterId: ${clusterId} | mailx -s "Report Center Creation Status" ${notifyEmail}`;
	console.log(`Trying to send email out with cmd: ${mailxCMD}`);

	exec(mailxCMD, (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		if (stdout) {
			console.log(`stdout: ${stdout}`);
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
		}
	});
}
