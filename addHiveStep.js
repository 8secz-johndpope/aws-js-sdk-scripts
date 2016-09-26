#!/usr/bin/env node

let AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });

let args = process.argv.slice(2);
//the first argument should be the stepName and 2nd be the hql file name;
addHiveStep(args[0], args[1]);

function getStagingBucket() {
    let s3 = new AWS.S3();
    const STAGE_BUCKETS = ['application-dev-staging', 'application-qa-staging', 'application-prod-staging'];
    return new Promise((resolve, reject) => {
        s3.listBuckets(function(err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err);
            } else {
                let targetBucket = data.Buckets.find((bucket) => STAGE_BUCKETS.some((stageBucket) => bucket.Name.indexOf(stageBucket) >= 0));
                console.log(`targetBucket : ${targetBucket.Name}`);
                return resolve(targetBucket.Name);
            }
        });
    });
}

function getClusterId() {
    let emr = new AWS.EMR();
    let params = { ClusterStates: ['RUNNING', 'WAITING'] };
    const CLUSTER_NAME = 'RC.HIVE.ADHOC';

    return new Promise((resolve, reject) => {
        emr.listClusters(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err);
            } else {
                let targetEmr = data.Clusters.find((ins) => ins.Name === CLUSTER_NAME);
                console.log(`targetEmr : ${targetEmr.Id}`);
                return resolve(targetEmr.Id);
            }
        });
    });
}

function addHiveStep(stepName, hqlFile) {
    const exec = require('child_process').exec;
    Promise.all([getClusterId(), getStagingBucket()]).then((values) => {
        let clusterId = values[0];
        let bucketName = values[1];
        const env = getEnvFromBucketName(bucketName);
        const fileLocation = bucketName + '/RC/' + env + '/hive-scripts/' + hqlFile;
        let cmd = 'aws emr add-steps --cluster-id ' + clusterId + ' --steps Type=HIVE,Name="' + stepName + '",ActionOnFailure=CONTINUE,Args=[-f,' + fileLocation + ']';
        exec('echo ' + cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });
    });

}

function getEnvFromBucketName(bucketName) {
    if (bucketName.indexOf('dev') >= 0) {
        return 'DEV';
    }
    if (bucketName.indexOf('qa') >= 0) {
        return 'QA';
    }
    if (bucketName.indexOf('prod') >= 0) {
        return 'PROD';
    }
    throw new Error('unsupported env for bucket: ' + bucketName);
}
