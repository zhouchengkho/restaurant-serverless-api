
function genBaseResponse(statusCode) {
    let response = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            // 'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'POST,PUT,DELETE,GET,OPTIONS'
        }
    };
    if (statusCode) {
        response.statusCode = statusCode;
    }
    return response;
}

module.exports.error = (err) => {
    let res = genBaseResponse(400);
    let body = {success: false, code: ''};
    if (err.message) {
        body.message = err.message;
    }
    res.body = JSON.stringify(body);
    return res;
};

module.exports.success = (data) => {
    let res = genBaseResponse(200);
    let body = {success: true};
    if (data) {
        body.data = data;
    }
    res.body = JSON.stringify(body);
    return res;
};
