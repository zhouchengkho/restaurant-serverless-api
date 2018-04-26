'use strict';
const AWS = require('aws-sdk');
const yelp = require('yelp-fusion');
const config = require('../config');
const yelpApiKey = config.yelpApi;
const client = yelp.client(yelpApiKey);
const lexruntime = new AWS.LexRuntime();


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

    client.search(searchParam).then( response => {
        let resname = response.jsonBody.businesses[0].name;
        let phone = response.jsonBody.businesses[0].phone;
        let region = response.jsonBody.region.center;
        let address =  response.jsonBody.businesses[0].location.address1;
        let image = response.jsonBody.businesses[0].image_url;
        console.log(resname);
        att = {
            "resname" : resname,
            "phone" : phone,
            "region" : region,
            "address" : address,
            "image": image
        }
        console.log(att);
        console.log(JSON.stringify(att));
        let data = JSON.stringify(att);
        console.log(data);
        callback(close(data, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));
    }).catch(e => {
        console.log(e);
    });
    // callback(close(att, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));

    // callback(close(intentRequest.sessionAttributes, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));
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