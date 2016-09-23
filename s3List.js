#!/usr/bin/env node

var AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-1'});
var s3 = new AWS.S3();
const STAGE_BUCKETS = ['application-dev-staging','application-qa-staging', 'application-prod-staging'];

s3.listBuckets(function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else{
        let target = data.Buckets.find((bucket) => STAGE_BUCKETS.some((stageBucket) => bucket.Name.indexOf(stageBucket) >=0));
        console.log(target);
  }
});
