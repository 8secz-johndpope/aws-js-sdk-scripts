#!/usr/bin/env node

let AWS = require('aws-sdk');
let awsUtil = require('./lib/awsUtil');

AWS.config.update({ region: 'us-east-1' });

let emr = new AWS.EMR();

let args = process.argv.slice(2);
//the first argument should be the stepName and 2nd be the hql file name;
//let stepName = args[0];

const RC_CLUSTER_NAME = 'RC.HIVE.ADHOC';


Promise.all([awsUtil.getClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then(
    (values) => {
        let clusterId = values[0];
        let bucketName = values[1];
        if (clusterId) {
            console.log(`Cluster ${RC_CLUSTER_NAME} already exist! Quit`);
        } else {
            const env = awsUtil.getEnvFromBucketName(bucketName);
            return awsUtil.createCluster(RC_CLUSTER_NAME);
        }
    }).then((newClusterId) => {
    if (newClusterId) {
        console.log(`New cluster created, ID: ${clusterId}`);
    }
});
