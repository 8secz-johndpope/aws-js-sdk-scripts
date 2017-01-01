let Consts = {};
Consts.STAGE_BUCKETS = {
    DEV: 'application-dev-staging',
    QA: 'application-qa-staging',
    PROD: 'application-prod-staging'
};
Consts.AWS_SCRIPT_RUN_JAR = 's3://elasticmapreduce/libs/script-runner/script-runner.jar';

//Make `Consts` immutable and expose it.
module.export = Object.freeze(Consts);