'use strict';
const AWS = require('aws-sdk');
const config = require('../config');
const yelp = require('yelp-fusion');
const config = require('../config');
const yelpApiKey = config.yelpApi;
const client = yelp.client(yelpApiKey);


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
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}



function diningSuggestions(intentRequest, callback) {
    const location = intentRequest.currentIntent.slots.Location;
    const cuisine = intentRequest.currentIntent.slots.Cuisine;
    const number = intentRequest.currentIntent.slots.NumberOfPeople;

    if (source === 'DialogCodeHook'){
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    console.log("callback dinningSuggestion" + callback);

    let searchParam = {
        term:'restaurant',
        location: location,
        category:cuisine,
        sort_by:'best_match',
        limit:5
    };

    let resJson = {};

    client.search(searchParam).then(response => {
        let resname = response.jsonBody.businesses[0].name;
        let phone = response.jsonBody.businesses[0].phone;
        let address = response.jsonBody.businesses[0].location.address1;
        let latitude = response.jsonBody.businesses[0].latitude;
        let longitude = response.jsonBody.businesses[0].longitude;
        resJson = {
            "resname" : resname,
            "phone" : phone,
            "address" : address,
            "latitude" : latitude,
            "longitude" : longitude
        };
        console.log(resJson);
    });

    callback(close(resJson, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));
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