const ResponseBuilder = require('../util/ResponseBuilder');


module.exports.helloworld = (event, context, callback) => {
    callback(null, ResponseBuilder.success({
        message: 'hey wassup'
    }));
}