#!/usr/bin/env node

let AWS = require('aws-sdk');
let awsUtil = require('./lib/awsUtil');

AWS.config.update({region: 'us-east-1'});

let emr = new AWS.EMR();

let envConfig = require('./profile/envConfig');
const RC_CLUSTER_NAME = envConfig.shared.clusterName;

awsUtil.getStartingOrActiveClusterId(RC_CLUSTER_NAME).then(
    (clusterId) => {
        if(clusterId){
            console.log(`ready to terminate cluster with id: ${clusterId}`);

            var params = {
                JobFlowIds: [
                    clusterId
                ]
            };
            emr.terminateJobFlows(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            });
        }else {
            console.log(`Not cluster exist for name: ${RC_CLUSTER_NAME}, quit....`);
        }
    });/**
 * Created with IntelliJ IDEA.
 * User: liha
 * Date: 12/30/16
 * Time: 10:20 PM
 */
