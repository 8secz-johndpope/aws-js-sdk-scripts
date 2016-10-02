var exports = module.exports = {};

let AWS = require('aws-sdk');

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
};

exports.getClusterId = function(clusterName) {
    let params = { ClusterStates: ['STARTING', 'BOOTSTRAPPING', 'RUNNING', 'WAITING'] };
    return getEmr(params, clusterName);
};

function getEmr(params, clusterName) {
    let emr = new AWS.EMR();
    return new Promise((resolve, reject) => {
        emr.listClusters(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err);
            } else {
                let targetEmr = data.Clusters.find((ins) => ins.Name === clusterName);

                if (targetEmr) {
                    console.log(`existing Emr : ${targetEmr.Id}`);
                    return resolve(targetEmr.Id);
                } else {
                    //Here aws only return first 50 clusters, so our cluster might be in the next/next page hence need to chain promise here.
                    if (data.Marker) {
                        console.log(`Trying to find '${clusterName}' in next page with Marker : ${data.Marker}`);
                        let newParam = Object.assign({}, params, { Marker: data.Marker });
                        return resolve(getEmr(newParam, clusterName));
                    } else {
                        return resolve(undefined);
                    }
                }
            }
        });
    });
}

exports.getEnvFromBucketName = function(bucketName) {
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
};


exports.createCluster = function(clusterName) {
    let emr = new AWS.EMR();
    let newClusterParams = {
        Instances: {
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
        Name: clusterName,
        AmiVersion: '3.9.0',
        BootstrapActions: [{
            Name: 'Encrypt Disks',
            ScriptBootstrapAction: {
                Path: 's3://4652-5751-2377-application-dev-staging/RC/hive-scripts/encrypt_disks.sh'
            }
        }, {
            Name: 'Change time zone to NY',
            ScriptBootstrapAction: {
                Path: 's3://4652-5751-2377-application-dev-staging/RC/hive-scripts/changeTimezone.sh'
            }
        }, {
            Name: 'Create self signed keystore for SSL',
            ScriptBootstrapAction: {
                Path: 's3://4652-5751-2377-application-dev-staging/RC/hive-scripts/create_self_signed_keystore.sh'
            }
        }, {
            Name: 'DisableHiveStats',
            ScriptBootstrapAction: {
                Path: 's3://support.elasticmapreduce/bootstrap-actions/hive/0.13.0/add_autogather.rb'
            }
        }, {
            Name: 'IncreaseMetaStoreHeapSize',
            ScriptBootstrapAction: {
                Path: 's3://4652-5751-2377-application-dev-staging/RC/hive-scripts/set_hive_heapsize.rb',
                Args: [
                    "--metastore-heapsize=12288",
                    "--hiveserver2-heapsize=4048",
                    "--hive-cli-heapsize=8192"
                ]
            }
        }, {
            Name: 'FixHiveSplitSize',
            ScriptBootstrapAction: {
                Path: 's3://4652-5751-2377-application-dev-staging/RC/hive-scripts/fix_hive_split_size.sh'
            }
        }, {
            Name: 'Enable s3ServerSideEncryption & Fair Scheduler',
            ScriptBootstrapAction: {
                Path: 's3://elasticmapreduce/bootstrap-actions/configure-hadoop',
                Args: [
                    "-e", "fs.s3.enableServerSideEncryption=true",
                    "-y", "yarn.resourcemanager.scheduler.class=org.apache.hadoop.yarn.server.resourcemanager.scheduler.fair.FairScheduler"
                ]
            }
        }, {
            Name: 'Fix TCP Packet Loss',
            ScriptBootstrapAction: {
                Path: 's3://support.elasticmapreduce/bootstrap-actions/ami/3.1.0/tcpPacketLoss.sh'
            }
        }, {
            Name: 'Install Hive Site Configuration',
            ScriptBootstrapAction: {
                Path: 's3://elasticmapreduce/libs/hive/hive-script',
                Args: [
                    "--base-path", "s3://elasticmapreduce/libs/hive",
                    "--install-hive-site", "--hive-site=s3://4652-5751-2377-application-dev-staging/RC/hive-conf/hive-site.xml",
                    "--hive-versions", "latest"
                ]
            }
        }, {
            Name: 'Copy over hive authentication files',
            ScriptBootstrapAction: {
                Path: 's3://4652-5751-2377-application-dev-staging/RC/hive-scripts/copy_config_s3_files.sh'
            }
        }, {
            Name: 'InstallGanglia',
            ScriptBootstrapAction: {
                Path: 's3://elasticmapreduce/bootstrap-actions/install-ganglia'
            }
        }],
        JobFlowRole: 'EMR_Scheduler_RC',
        ServiceRole: 'SVC_EMR_RC_SR',
        Tags: [{
            Key: 'Cost Center',
            Value: 'SCR901'
        }, {
            Key: 'AGS',
            Value: 'RC'
        }],
        VisibleToAllUsers: true
    };
    console.log('creating new cluster with config: ' + JSON.stringify(newClusterParams));
    return new Promise((resolve, reject) => {
        emr.runJobFlow(newClusterParams, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(data);
                return resolve(data.JobFlowId)
            }
        });
    });
}
