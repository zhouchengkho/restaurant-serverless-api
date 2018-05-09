const AWS = require('aws-sdk');
const config = require("../config");
const ResponseBuilder = require('../util/ResponseBuilder');
const uuid = require("uuid");
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: "https://search-restaurant-skcsrfusurlykmrlyjy4tuaf5e.us-east-1.es.amazonaws.com/"
});

module.exports.handle = (event, context, callback) => {
    try {
        const body = JSON.parse(event.body);
        const userId = body.user_id;
        const restaurant_id = body.restaurant_id;
        const like = body.like;

        let item = {
            user_id : userId,
            restaurant_id: restaurant_id,
            like: like
        };

        let bulkBody = [
            { index:  { _index: 'preferences', _type: 'preference' } },
            item
        ]
        client.bulk({
            body: bulkBody
        }, (err, result) => {
            if (err) {
                console.log(err);
            }
            callback(null, ResponseBuilder.success({}));
        })
    } catch (err) {
        console.log(err);
        callback(null, ResponseBuilder.error({}));
    }
};