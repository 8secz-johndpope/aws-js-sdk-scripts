#!/usr/bin/env node
var AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });
var elb = new AWS.ELB();

var params = {
  Instances: [ /* required */
    {
      InstanceId: 'i-26e74463'
    },
    /* more items */
  ],
  LoadBalancerName: 'AWSLBADDSED02' /* required */
};
elb.registerInstancesWithLoadBalancer(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});