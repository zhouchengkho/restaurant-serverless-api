const ResponseBuilder = require('../util/ResponseBuilder');


module.exports.handle = (event, context, callback) => {
    callback(null, ResponseBuilder.success({}));
}