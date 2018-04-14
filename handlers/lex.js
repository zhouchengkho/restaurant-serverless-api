'use strict';
const AWS = require('aws-sdk');
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

    if (location != null && !location.match('^[a-zA-Z]+$')) {
        callback(close(intentRequest.sessionAttributes, 'Failed', {
            contentType: 'PlainText', content: 'Please Input Valid location.'
        }));
    }

    if (cuisine != null && !cuisine.match('^[a-zA-Z]+$')) {
        callback(close(intentRequest.sessionAttributes, 'Failed', {
            contentType: 'PlainText', content: 'Please Input Valid Cuisine.'
        }));
    }

    if (number != null && !number.match('/^\\d+$/')) {
        callback(close(intentRequest.sessionAttributes, 'Failed', {
            contentType: 'PlainText', content: 'Please Input Valid number.'
        }));
    }


    if (source === 'DialogCodeHook'){
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    let data = {
        "location": location,
        "cuisine": cuisine,
        "number": number,
    };


    let searchParam = {
        term:'restaurant',
        location: data.location,
        category:data.cuisine,
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
        }
        console.log(resJson);
    });

    callback(null, resJson);
    // callback(close(intentRequest.sessionAttributes, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));
}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'SuggestionIntent') {
        return diningSuggestions(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}


module.exports.handle = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};