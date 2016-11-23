#!/usr/bin/env node

var fs = require('fs'),
    xml2js = require('xml2js'),
    xmlBuilder = new xml2js.Builder(),
    parser = new xml2js.Parser();

let configFile = 'sample.xml';

fs.readFile(configFile, function(err, data) {
    parser.parseString(data, function(err, result) {
        console.log(result.configuration.property.length);
        let target = result.configuration.property.find((el) => el.name[0] === 'javax.jdo.option.ConnectionURL');
        target.value[0] += '?trustServerCertificate=true&amp;useSSL=true&amp;requireSSL=true&amp;createDatabaseIfNotExist=false';
        console.log(target);
        let xml = xmlBuilder.buildObject(result);
        fs.writeFile(configFile, xml);
        console.log('DONE');
    });
});
