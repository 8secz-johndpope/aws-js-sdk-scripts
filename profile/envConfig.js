let envConfig = {};
envConfig.shared = {
    JobFlowRole: 'EMR_Scheduler_RC',
    ServiceRole: 'SVC_EMR_RC_SR',
    clusterName: 'RC.HIVE.ADHOC',
    owner:'Han Li',
    region: 'us-east-1'
};

envConfig.DEV = Object.assign({}, envConfig.shared);
envConfig.QA = Object.assign({}, envConfig.shared);
envConfig.PROD = Object.assign({}, envConfig.shared);

envConfig.QA.env = 'PROD';
envConfig.QA.AdditionalMasterSecurityGroups = ['sg-fba67883', 'sg-5fc45539'];
envConfig.QA.LogUri = 's3://5101-9919-3688-logs/EMR/RC/daily/adhoc_query_cluster/';
envConfig.QA.EmrManagedMasterSecurityGroup = 'sg-41614624';
envConfig.QA.EmrManagedSlaveSecurityGroup = 'sg-43614626';
envConfig.QA.Ec2KeyName = 'APP_RC_PROD';
envConfig.QA.RcS3StageDir = 's3://5101-9919-3688-application-prod-staging';
envConfig.QA.Ec2SubnetId = 'subnet-76cca85d';
envConfig.QA.elbName = 'AWSLBRCEP01';
envConfig.QA.coreInstanceCount = 8;

envConfig.QA.env = 'QA';
envConfig.QA.AdditionalMasterSecurityGroups = ['sg-e5a60383', 'sg-23f6f65a'];
envConfig.QA.LogUri = 's3://1422-4800-0760-logs/EMR/RC/daily/adhoc_query_cluster/';
envConfig.QA.EmrManagedMasterSecurityGroup = 'sg-a7abc9c2';
envConfig.QA.EmrManagedSlaveSecurityGroup = 'sg-a6abc9c3';
envConfig.QA.Ec2KeyName = 'APP_RC_QA';
envConfig.QA.RcS3StageDir = 's3://1422-4800-0760-application-qa-staging';
envConfig.QA.Ec2SubnetId = 'subnet-80ec0ff7';
envConfig.QA.elbName = 'AWSLBRCEQ01';
envConfig.QA.coreInstanceCount = 8;

envConfig.DEV.env = 'DEV';
envConfig.DEV.AdditionalMasterSecurityGroups = ['sg-17746a70', 'sg-8d79e1f4'];
envConfig.DEV.LogUri = 's3://4652-5751-2377-logs/EMR/RC/daily/adhoc_query_cluster/';
envConfig.DEV.EmrManagedMasterSecurityGroup = 'sg-cb17b1ae';
envConfig.DEV.EmrManagedSlaveSecurityGroup = 'sg-d417b1b1';
envConfig.DEV.Ec2KeyName = 'APP_RC_DEV';
envConfig.DEV.RcS3StageDir = 's3://4652-5751-2377-application-dev-staging';
envConfig.DEV.Ec2SubnetId = 'subnet-56a99422';
envConfig.DEV.elbName = 'AWSLBRCED01';
envConfig.DEV.coreInstanceCount = 4;

module.exports = envConfig;
