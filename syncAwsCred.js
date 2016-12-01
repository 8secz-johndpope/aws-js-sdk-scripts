#!/usr/bin/env node

let fs = require('fs');
let https = require('https');

let args = process.argv.slice(2);
//if first arg is 0, we set one time. Otherwise(not provided or not 0), refresh every hour!
let infinite = args[0] || 1;
let role = args[1] || 'priv_aws_rc_dev_d';
let user = args[2] || process.env.USER || 'LiHa';
let pw = args[3] || process.env.pw;

function refreshAwsCred() {
	let requestBody = {
		domain: 'NASDCORP',
		username: user,
		password: pw,
		roleProviderARN: 'arn:aws:iam::465257512377:saml-provider/FINRA',
		isRoleProviderMaint: 'false',
		durationSeconds: '3600',
		mfa: '',
		roleToAssumeARN: 'arn:aws:iam::465257512377:role/' + role
	};
	let jsonBody = JSON.stringify(requestBody);
	console.log('requestbody: ' + JSON.stringify(requestBody, null, 2));

	let postHeaders = {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(jsonBody, 'utf8')};

	let options = {
		host: 'cloudpass.finra.org',
		path: '/cloudpass/api/v1/getToken',
		method: 'POST',
		port: 443,
		headers: postHeaders
	};

	let httpRespStr = '';
	let postRequest = https.request(options, (res) => {
		console.log('statusCode: ', res.statusCode);
		console.log('headers: ', res.headers);
		res.on('data', function (chunk) {
			httpRespStr += chunk;
		});

		res.on('end', () => {
			let awsCreds = JSON.parse(httpRespStr);
			console.info('AWS Credentials:\n');
			console.info(awsCreds);
			console.info('\n\nPOST completed');

			writeCredentialsFile(awsCreds);
		})
	});

	postRequest.write(jsonBody);
	postRequest.end();
	postRequest.on('error', (e) =>console.error(e));
}

function extract(awsCreds) {
	let aws_access_key_id = 'aws_access_key_id=' + awsCreds.awsAccessKeyId;
	let aws_secret_access_key = 'aws_secret_access_key=' + awsCreds.awsSecretKey;
	let aws_session_token = 'aws_session_token=' + awsCreds.awsSessionToken;
	return [aws_access_key_id, aws_secret_access_key, aws_session_token];
}
function writeCredentialsFile(awsCreds) {
	let profile = '[default]';
	let content = [profile, ...extract(awsCreds)].join('\n');
	let fileToWrite = process.env.HOME + '/.aws/credentials';
	console.log(`new ${fileToWrite} file content: \n` + content);
	fs.writeFile(fileToWrite, content, (err)=> {
		if (err) {
			return console.log(err);
		}
		console.log(`The ${fileToWrite} was saved!`);
	})
}

refreshAwsCred();
//if first arg is 0, we set one time. Otherwise(not provided or not 0), refresh every hour!
if (infinite) {
	console.log('************************ start to refresh aws credentials every hour! ************************');
	setInterval(refreshAwsCred, 3600000);
}



