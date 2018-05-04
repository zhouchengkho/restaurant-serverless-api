'use strict';


module.exports.handle = (event, context, callback) => {
    try {
        // {
        //     user_id:,
        //     restaurant_id:,
        //     like: 0
        // }
        const userId = event.user_id;
        const restaurant_id = event.restaurant_id;
        const like = event.like;


    } catch (err) {
        callback(err);
    }
};