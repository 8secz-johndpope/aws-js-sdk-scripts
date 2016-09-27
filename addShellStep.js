#!/usr/bin/env node

let AWS = require('aws-sdk');
let awsUtil = require('./lib/awsUtil');

AWS.config.update({ region: 'us-east-1' });

let emr = new AWS.EMR();

let args = process.argv.slice(2);
//the first argument should be the stepName and 2nd be the hql file name;
let stepName = args[0];
let shellFile = args[1];

const RC_CLUSTER_NAME = 'RC.HIVE.ADHOC';

//first get cluster id and s3 bucket prefix so that we can add step.
Promise.all([awsUtil.getClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then((values) => {
	let clusterId = values[0];
	let bucketName = values[1];
	const env = awsUtil.getEnvFromBucketName(bucketName);
	const AWS_SCRIPT_RUN_JAR = 's3://elasticmapreduce/libs/script-runner/script-runner.jar';
	const fileLocation = 's3://' + bucketName + '/RC/' + env + '/hive-scripts/' + shellFile;
	console.log(`File to execute: ${fileLocation}`);
	let params = {
		JobFlowId: clusterId,
		Steps: [ 
			{
				HadoopJarStep: { 
					Jar: AWS_SCRIPT_RUN_JAR,
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
