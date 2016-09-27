some aws js sdk scripts for EMR like adding hive step. adding shell step, finding cluster/s3 bucket etc...

Note: these are run in the ec2 boxes with IAM role that enables these actions and has hidden process fetching aws credentials. If you are not running in such AMIs, then you have to add credentials for the AWS object.

# References
JS SDK official doc: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EMR.html

AWS CLI official doc: http://docs.aws.amazon.com/cli/latest/index.html
