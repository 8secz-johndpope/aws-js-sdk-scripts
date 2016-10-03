#!/usr/bin/env node

var AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });
var emr = new AWS.EMR();

var params = { ClusterStates: ['RUNNING', 'WAITING'] };

function getEmr(params) {
    emr.listClusters(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            var rcEmr = data.Clusters.find((ins) => ins.Name === 'RC.HIVE.ADHOC');
            if (!rcEmr && data.Marker) {
                return getEmr({Marker: data.Marker})
            } else {
                console.log(rcEmr);
                return rcEmr;
            }
        }
    });
}

getEmr(params);
