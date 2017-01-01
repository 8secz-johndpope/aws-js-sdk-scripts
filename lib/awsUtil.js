var exports = module.exports = {};

let Consts = require('../profile/Consts');
let AWS = require('aws-sdk');

exports.getStagingBucket = function () {
    let s3 = new AWS.S3();
    return new Promise((resolve, reject) => {
        s3.listBuckets(function (err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err);
            }
            else {
                let targetBucket = data.Buckets.find((bucket) => Object.values(Consts.STAGE_BUCKETS).some((stageBucket) => bucket.Name.includes(stageBucket)));
                console.log(`targetBucket : ${targetBucket.Name}`);
                return resolve(targetBucket.Name);
            }
        });
    });
};

exports.getStartingOrActiveClusterId = function (clusterName) {
    let params = {ClusterStates: ['STARTING', 'BOOTSTRAPPING', 'RUNNING', 'WAITING']};
    return getEmr(params, clusterName);
};


exports.getActiveClusterId = function (clusterName) {
    let params = {ClusterStates: ['RUNNING', 'WAITING']};
    return getEmr(params, clusterName);
};

function getEmr(params, clusterName) {
    let emr = new AWS.EMR();
    return new Promise((resolve, reject) => {
        emr.listClusters(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err);
            }
            else {
                let targetEmr = data.Clusters.find((ins) => ins.Name === clusterName);

                if (targetEmr) {
                    console.log(`existing Emr : ${targetEmr.Id}`);
                    return resolve(targetEmr.Id);
                }
                else {
                    //Here aws only return first 50 clusters, so our cluster might be in the next/next page hence need to chain promise here.
                    if (data.Marker) {
                        console.log(`Trying to find '${clusterName}' in next page with Marker : ${data.Marker}`);
                        let newParam = Object.assign({}, params, {Marker: data.Marker});
                        return resolve(getEmr(newParam, clusterName));
                    }
                    else {
                        return resolve(undefined);
                    }
                }
            }
        });
    });
}

exports.getEnvFromBucketName = function (bucketName) {
    return Object.keys(Consts.STAGE_BUCKETS).find(env => bucketName.includes(Consts.STAGE_BUCKETS[env]));
};


exports.createCluster = function (envParams) {
    let emr = new AWS.EMR();
    let moment = require('moment');

    let newClusterParams = {
        Instances: {
            AdditionalMasterSecurityGroups: envParams.AdditionalMasterSecurityGroups,
            Ec2KeyName: envParams.Ec2KeyName,
            Ec2SubnetId: envParams.Ec2SubnetId,
            EmrManagedMasterSecurityGroup: envParams.EmrManagedMasterSecurityGroup,
            EmrManagedSlaveSecurityGroup: envParams.EmrManagedSlaveSecurityGroup,
            InstanceGroups: [{
                InstanceCount: 1,
                InstanceRole: 'MASTER',
                InstanceType: 'm3.2xlarge',
                BidPrice: '2',
                Market: 'SPOT',
                Name: 'Master-Node'
            }, {
                InstanceCount: envParams.coreInstanceCount,
                InstanceRole: 'CORE',
                InstanceType: 'm3.xlarge',
                BidPrice: '2',
                Market: 'SPOT',
                Name: 'Slave-Node'
            }],
            KeepJobFlowAliveWhenNoSteps: true,
        },
        Name: envParams.clusterName,
        ReleaseLabel: 'emr-4.8.2',
        Applications: [
            {
                Name: 'Hive'
            },{
                Name: 'Tez'
            }
        ],
        BootstrapActions: [{
            Name: 'Encrypt Disks',
            ScriptBootstrapAction: {
                Path: envParams.RcS3StageDir + '/RC/' + envParams.env + '/hive-scripts/encrypt_disks.sh'
            }
        }, {
            Name: 'Change time zone to NY',
            ScriptBootstrapAction: {
                Path: envParams.RcS3StageDir + '/RC/' + envParams.env + '/hive-scripts/changeTimezone.sh'
            }
        }],
        JobFlowRole: envParams.JobFlowRole,
        LogUri: envParams.LogUri + moment().format('YYYY-MM-DD'),
        ServiceRole: envParams.ServiceRole,
        Steps: [{
            HadoopJarStep: {
                Jar: Consts.AWS_SCRIPT_RUN_JAR,
                Args: [
                    `${envParams.RcS3StageDir}/RC/${envParams.env}/hive-scripts/copy_config_s3_files.sh`
                ]
            },
            Name: 'Copy over hive configuration files',
            ActionOnFailure: 'TERMINATE_CLUSTER'
        },{
            HadoopJarStep: {
                Jar: Consts.AWS_SCRIPT_RUN_JAR,
                Args: [
                    `${envParams.RcS3StageDir}/RC/${envParams.env}/hive-scripts/create_self_signed_keystore.sh`
                ]
            },
            Name: 'Create self signed keystore for SSL',
            ActionOnFailure: 'TERMINATE_CLUSTER'
        }],
        Tags: [{
            Key: 'Cost Center',
            Value: 'SCR901'
        }, {
            Key: 'AGS',
            Value: 'RC'
        }, {
            Key: 'SDLC',
            Value: envParams.env
        }, {
            Key: 'Owner',
            Value: envParams.owner
        }, {
            Key: 'Name',
            Value: 'RC_HIVE_QUERY'
        }],
        VisibleToAllUsers: true
    };
    console.log('creating new cluster with config: ' + JSON.stringify(newClusterParams));
    return new Promise((resolve, reject) => {
        emr.runJobFlow(newClusterParams, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            }
            else {
                console.log(data);
                return resolve(data.JobFlowId)
            }
        });
    });
};

exports.getEmrMaster = function (clusterId) {
    let emr = new AWS.EMR();

    let params = {
        ClusterId: clusterId,
        InstanceGroupTypes: [
            'MASTER'
        ]
    };

    return new Promise((resolve, reject) => {
        emr.listInstances(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            }
            else {
                console.log('EMR Master EC2: ' + JSON.stringify(data));
                return resolve(data.Instances[0].Ec2InstanceId)
            }
        });
    });
};

exports.regElbInstance = function (ec2Id, elbName) {
    var elb = new AWS.ELB();
    var params = {
        Instances: [{
            InstanceId: ec2Id
        }],
        LoadBalancerName: elbName
    };
    elb.registerInstancesWithLoadBalancer(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });
};

exports.getClusterState = function (clusterId) {
    var emr = new AWS.EMR();

    var params = {
        ClusterId: clusterId
    };
    return new Promise((resolve, reject) => {
        emr.describeCluster(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            }
            else {
                //console.log(data);
                return resolve(data.Cluster.Status.State)
            }
        });
    })
};

exports.addShellStep = function (clusterId, fileLocation, stepName) {
    var emr = new AWS.EMR();
    console.log(`File to execute: ${fileLocation}`);
    let params = {
        JobFlowId: clusterId,
        Steps: [{
            HadoopJarStep: {
                Jar: Consts.AWS_SCRIPT_RUN_JAR,
                Args: [
                    fileLocation
                ]
            },
            Name: stepName,
            ActionOnFailure: 'CONTINUE'
        }]
    };
    emr.addJobFlowSteps(params, function (err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
    });
};
