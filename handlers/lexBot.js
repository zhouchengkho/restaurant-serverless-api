'use strict';
const AWS = require('aws-sdk');
const yelp = require('yelp-fusion');
const config = require('../config');
const yelpApiKey = config.yelpApi;
const client = yelp.client(yelpApiKey);
const lexruntime = new AWS.LexRuntime();
const attr = require('dynamodb-data-types').AttributeValue;
const dynamodb = new AWS.DynamoDB();



function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    console.log("delegate + " + sessionAttributes);
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}



function diningSuggestions(intentRequest, callback) {
    console.log("intentRequest is" + JSON.stringify(intentRequest));
    const location = intentRequest.currentIntent.slots.Location;
    const cuisine = intentRequest.currentIntent.slots.Cuisine;
    const number = intentRequest.currentIntent.slots.NumberOfPeople;
    const source = intentRequest.invocationSource;
    let att = {};

    if (source === 'DialogCodeHook'){
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    let searchParam = {
        term:'restaurant',
        location: location,
        category: cuisine,
        sort_by:'best_match',
        limit:1
    };

    client.search(searchParam).then( (response) => {
        let resname = response.jsonBody.businesses[0].name;
        let phone = response.jsonBody.businesses[0].phone;
        let region = response.jsonBody.region.center;
        let address =  response.jsonBody.businesses[0].location.address1;
        let image = response.jsonBody.businesses[0].image_url;
        console.log(resname);
        att = {
            "resname" : resname,
            "phone" : phone,
            "long" : region.longitude,
            "lat": region.latitude,
            "address" : address,
            "image": image
        }
        return att;
    }).then((att) => {
        callback(close(att, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly!' }));
    }).catch( e => {
        console.log("err is " + e);
    });
}

function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const intentName = intentRequest.currentIntent.name;
    if (intentName === 'SuggestionIntent') {
        return diningSuggestions(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}

module.exports.handle = (event, context, callback) => {
    try {
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};