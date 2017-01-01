#!/usr/bin/env node

let AWS = require('aws-sdk');
let awsUtil = require('./lib/awsUtil');
let Consts = require('./profile/Consts');
let envConfig = require('./profile/envConfig');

AWS.config.update({ region: envConfig.shared.region});

let emr = new AWS.EMR();

let args = process.argv.slice(2);
//the first argument should be the stepName and 2nd be the shell file name;
let stepName = args[0];
let shellFile = args[1];

const RC_CLUSTER_NAME = envConfig.shared.clusterName;

//first get cluster id and s3 bucket prefix so that we can add step.
Promise.all([awsUtil.getActiveClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then((values) => {
	let clusterId = values[0];
	let bucketName = values[1];
	const env = awsUtil.getEnvFromBucketName(bucketName);
	const fileLocation = `s3://${bucketName}/RC/${env}/hive-scripts/${shellFile}`;
	console.log(`File to execute: ${fileLocation}`);
	let params = {
		JobFlowId: clusterId,
		Steps: [ 
			{
				HadoopJarStep: { 
					Jar: Consts.AWS_SCRIPT_RUN_JAR,
					Args: [
						fileLocation
					]
				},
				Name: stepName,
				ActionOnFailure: 'CONTINUE'
			}
		]
	};
	emr.addJobFlowSteps(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else     console.log(data);           // successful response
	});
});
