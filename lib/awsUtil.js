
let AWS = require('aws-sdk');
var exports = module.exports = {};
exports.getStagingBucket = function() {
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

exports.getClusterId = function (clusterName) {
    let emr = new AWS.EMR();
    let params = {ClusterStates: ['RUNNING', 'WAITING']};

    return new Promise((resolve, reject) => {
        emr.listClusters(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err);
            }
            else {
                let targetEmr = data.Clusters.find((ins) => ins.Name === clusterName);
                if (!targetEmr && data.Marker) {
                    return resolve(getEmr({Marker: data.Marker}));
                } else {
                    console.log(`targetEmr : ${targetEmr.Id}`);
                    return resolve(targetEmr.Id);
                }
            }
        });
    });
};

exports.getEnvFromBucketName = function (bucketName) {
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