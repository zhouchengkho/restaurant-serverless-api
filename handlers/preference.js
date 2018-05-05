const AWS = require('aws-sdk');
const attr = require('dynamodb-data-types').AttributeValue;
const dynamodb = new AWS.DynamoDB();

module.exports.handle = (event, context, callback) => {
    try {
        // {
        //     user_id:,
        //     restaurant_id:,
        //     like: 0
        // }
        const body = JSON.parse(event.body);
        const userId = body.user_id;
        const restaurant_id = body.restaurant_id;
        const like = event.like;

        let obj = {
            "userId" : userId,
            "restaurant_id" : restaurant_id,
            "like" : like
        }
        let datawrap = attr.wrap(obj);
        let params = {
            RequestItems: {
                "restaurant": [{
                    PutRequest: {
                        Item: datawrap
                    }
                }]
            }
        }
        dynamodb.batchWriteItem(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
            /*
            data = {
            }
            */
        });

        callback(null, "successully added");



    } catch (err) {
        callback(err);
    }
};