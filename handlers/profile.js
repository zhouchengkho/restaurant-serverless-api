const AWS = require("aws-sdk");
const config = require("../config");
const ResponseBuilder = require('../util/ResponseBuilder');
const USER_TABLE_NAME = "user";

const dynamo = new AWS.DynamoDB.DocumentClient({
    accessKeyId: config.accessKey,
    secretAccessKey: config.accessSecret,
    region: "us-east-1"
});

module.exports.getProfile = (event, context, callback) => {
    console.log(event);
    let user_id = JSON.parse(event.body).user_id;
    let params = {
        TableName: USER_TABLE_NAME,
        Key: {
            id: user_id
        }
    };
    dynamo.get(params, (err, result) => {
        if (err) {
            callback(null, ResponseBuilder.error({}));
        } else {
            callback(null, ResponseBuilder.success(result.Item));
        }
    })
}