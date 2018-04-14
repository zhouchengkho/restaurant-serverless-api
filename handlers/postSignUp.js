const AWS = require("aws-sdk");
const config = require("../config");
const ResponseBuilder = require('../util/ResponseBuilder');

const dynamo = new AWS.DynamoDB.DocumentClient({
    accessKeyId: config.accessKey,
    secretAccessKey: config.accessSecret,
    region: "us-east-1"
});

module.exports.handle = (event, context, callback) => {
    let ua = event.request.userAttributes;
    console.log(ua);
    let params = {
        TableName: "user",
        Item: {
            id: ua.username,
            attributes: ua
        }
    };
    dynamo.put(params, (err, result) => {
        console.log(err);
        console.log(result);
        callback(null, ResponseBuilder.success({
            message: "ok"
        }))
    });
};