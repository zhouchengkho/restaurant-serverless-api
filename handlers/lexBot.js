'use strict';
const AWS = require('aws-sdk');
const config = require('../config');
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

    if (source === 'DialogCodeHook'){
        const outputSessionAttributes = intentRequest.sessionAttributes || {};
        callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    callback(close(intentRequest.sessionAttributes, 'Fulfilled',{ contentType: 'PlainText', content: 'You’re all set. Expect my recommendations shortly! Have a good day.' }));
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