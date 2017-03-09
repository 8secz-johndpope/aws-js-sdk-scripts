let config = {};

config.infinite = true;
config.role = 'priv_aws_rc_dev_d';
//define user here or it would default to the user in envrionment.
config.user = 'LiHa';
//define your base64 pw here or in envrionment as plain text.
config.pw = '';
//aws account(env specific)
config.awsAccount = '465257512377';

module.exports = Object.freeze(config);
