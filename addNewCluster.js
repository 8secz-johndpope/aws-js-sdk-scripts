#!/usr/bin/env node

let AWS = require('aws-sdk');
const exec = require('child_process').exec;
let awsUtil = require('./lib/awsUtil');

AWS.config.update({ region: 'us-east-1' });

let args = process.argv.slice(2);
//the first argument should be the stepName and 2nd be the hql file name;
let stepName = args[0];
let hqlFile = args[1];

const RC_CLUSTER_NAME = 'RC.HIVE.ADHOC';


Promise.all([awsUtil.getClusterId(RC_CLUSTER_NAME), awsUtil.getStagingBucket()]).then(
    (values) => {
        let clusterId = values[0];
        let bucketName = values[1];
        if (clusterId) {
            console.log(`Cluster ${RC_CLUSTER_NAME} already exist! Quit`);
        } else {
            const env = awsUtil.getEnvFromBucketName(bucketName);
            let newClusterParams = {
                instances: {
                    AdditionalMasterSecurityGroups: [
                        'sg-17746a70', 'sg-8d79e1f4'
                    ],
                    Ec2KeyName: 'APP_RC_DEV',
                    Ec2SubnetId: 'subnet-56a99422',
                    EmrManagedMasterSecurityGroup: 'sg-cb17b1ae',
                    EmrManagedSlaveSecurityGroup: 'sg-d417b1b1',
                    InstanceGroups: [{
                        InstanceCount: 1,
                        InstanceRole: 'MASTER',
                        InstanceType: 'm3.2xlarge',
                        BidPrice: '1',
                        Market: 'SPOT',
                        Name: 'Master-Node'
                    }, {
                        InstanceCount: 1,
                        InstanceRole: 'CORE',
                        InstanceType: 'm3.xlarge',
                        BidPrice: '1',
                        Market: 'SPOT',
                        Name: 'Slave-Node'
                    }],
                    KeepJobFlowAliveWhenNoSteps: true,

                },
                Name: RC_CLUSTER_NAME,
                AmiVersion: '3.9.0',
                Tags: [{
                    Key: 'Cost Center',
                    Value: 'SCR901'
                }, {
                    Key: 'AGS',
                    Value: 'RC'
                }]
            };
            console.log('creating new cluster with config: ' + JSON.Stringify(newClusterParams));
            emr.runJobFlow(newClusterParams, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(data); // successful response
            });

        }
    });
