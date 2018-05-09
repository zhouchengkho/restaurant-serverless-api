'use strict';
const AWS = require('aws-sdk');
const yelp = require('yelp-fusion');
const config = require('../config');
const lexruntime = new AWS.LexRuntime();

module.exports.handle = (event, context, callback) => {
    try {
        let bd =  JSON.parse(event.body).message[0];
        let params = {
            botAlias: 'restBot', /* required */
            botName: 'RestBot', /* required */
            userId: "Vincent",
            inputText: bd.text,
            sessionAttributes: {}
        };
        lexruntime.postText(params, function (err, data) {
            if (err) {
                console.log(err);
                callback(err);
            }
            if(data) {
                let response = {
                    "isBase64Encoded": true,
                    "statusCode": 200,
                    "headers": {
                        "Content-Type":"application/x-www-form-urlencoded"},
                    "body" : JSON.stringify(data)
                };
                callback(null, response)
            }
        });

    } catch (err) {
        callback(err);
    }
};