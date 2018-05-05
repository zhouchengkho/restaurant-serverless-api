const AWS = require('aws-sdk');
const attr = require('dynamodb-data-types').AttributeValue;
const config = require("../config");
const TABLE = "restaurantPreference";
const ResponseBuilder = require('../util/ResponseBuilder');
const uuid = require("uuid");
const dynamodb = new AWS.DynamoDB({
    accessKeyId: config.accessKey,
    secretAccessKey: config.accessSecret,
    region: "us-east-1"
});

module.exports.handle = (event, context, callback) => {
    try {
        const body = JSON.parse(event.body);
        const userId = body.user_id;
        const restaurant_id = body.restaurant_id;
        const like = event.like;

        let obj = {
            uuid: uuid.v4(),
            user_id : userId,
            restaurant_id: restaurant_id,
            like: like
        };
        let datawrap = attr.wrap(obj);
        let params = {
            Item: datawrap,
            ReturnConsumedCapacity: "TOTAL",
            TableName: TABLE
        };
        console.log("writing to dynamo");
        console.log(params);
        dynamodb.putItem(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
            callback(null, ResponseBuilder.success({}));
        });
    } catch (err) {
        console.log(err);
        callback(null, ResponseBuilder.error({}));
    }
};