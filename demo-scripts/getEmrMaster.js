#!/usr/bin/env node

var AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });
var emr = new AWS.EMR();

var params = {
    ClusterId: 'j-XLSVADALX855',
    InstanceGroupTypes: [
        'MASTER',
    ]
};

emr.listInstances(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
});
