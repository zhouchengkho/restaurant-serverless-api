const AWS = require("aws-sdk");
const config = require("../config");

const options = {
    accessKeyId: config.accessKey,
    secretAccessKey: config.accessKey,
    region: "us-east-1"
};

const dynamo = new AWS.DynamoDB.DocumentClient({
    accessKeyId: config.accessKey,
    secretAccessKey: config.accessSecret,
    region: "us-east-1"
});

let data = {
    TableName: "user",
    Item: {
        id: "cz1457@nyu.edu",
        data: "hey"
    }
};


dynamo.put(data, (err, result) => {
    console.log(err);
    console.log(result);
});