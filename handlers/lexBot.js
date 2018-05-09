'use strict';
const AWS = require('aws-sdk');
const yelp = require('yelp-fusion');
const config = require('../config');
const yelpApiKey = config.yelpApi;
const randomInt = require('random-int');
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
        limit:10
    };


    client.search(searchParam).then( (response) => {
        let len = response.jsonBody.businesses.length;
        let restaurant = [];
        let resObj = {};
        let mapIndex = {};
        for (let i = 0; i < 3; i++) {
            let index = randomInt(len);
            if (mapIndex[index]) {
                i--;
                continue;
            }
            mapIndex[index] = true;

            let resname = response.jsonBody.businesses[index].name;
            let phone = response.jsonBody.businesses[index].phone;
            let lat = response.jsonBody.businesses[index].coordinates.latitude;
            let long = response.jsonBody.businesses[index].coordinates.longitude;
            let address =  response.jsonBody.businesses[index].location.address1;
            let image = response.jsonBody.businesses[index].image_url;
            resObj = {
                "resname" : resname,
                "phone" : phone,
                "long" : long,
                "lat": lat,
                "address" : address,
                "image": image
            }
            restaurant.push(resObj);
        }
        console.log(JSON.stringify(restaurant));
        att = {
            restaurants: JSON.stringify(restaurant)
        };
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