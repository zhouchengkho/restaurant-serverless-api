const AWS = require('aws-sdk');
const config = require("../config");
const RESTAURANT_TABLE = "yelp-restaurants";
const ELASTIC_PREF_INDEX = 'preferences';
const ELASTIC_PREF_TYPE = 'preference';
const ResponseBuilder = require('../util/ResponseBuilder');
const Promise = require("bluebird");
const dynamodb = new AWS.DynamoDB({
    accessKeyId: config.accessKey,
    secretAccessKey: config.accessSecret,
    region: "us-east-1"
});
const random = require("../util/random");

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: "https://search-restaurant-skcsrfusurlykmrlyjy4tuaf5e.us-east-1.es.amazonaws.com/"
});
const categories = ["chinese", "indian", "korean", "french", "pizza"];

module.exports.handle = (event, context, callback) => {
    try {
        const body = JSON.parse(event.body);
        const user_id = body.user_id;
        let params = {
            index: ELASTIC_PREF_INDEX,
            type: ELASTIC_PREF_TYPE,
            q: 'user_id:' + user_id
        };
        client.search(params, (err, data) => {
            if (err) {
                return callback(null, ResponseBuilder.error(err));
            }
            if (data.hits.hits.length === 0 || Math.random() > 0.5) {
                elasticSearchCategory(categories[random.random(categories.length)]).then(result => {
                    callback(null, ResponseBuilder.success(result));
                }).catch(err => {
                    callback(null, ResponseBuilder.error({}));
                })
            } else if (Math.random() > 0.5) {
                searchWithCategories(data.hits.hits).then(result => {
                    callback(null, ResponseBuilder.success(result));
                }).catch(err => {
                    callback(null, ResponseBuilder.error({}));
                })
            } else {
                searchWithIds(data.hits.hits).then(result => {
                    callback(null, ResponseBuilder.success(result));
                }).catch(err => {
                    callback(null, ResponseBuilder.error({}));
                })
            }
        })
    } catch (err) {
        console.log(err);
        callback(null, ResponseBuilder.error({}));
    }


    /**
     *
     * @param data
     * @returns {*}
     * [
     *  {
     *      "id": ""
     *      "name": "",
     *      "address": "",
     *      "coordinate": {
     *          "lat": 11.22,
     *          "lng": 22.33
     *      },
     *      "rating": 4,
     *      "review_count": 1
     *  }
     * ]
     */
    function searchWithIds(data) {
        let count = 0;
        let total = 5;
        let params = {
            RequestItems: {
                [RESTAURANT_TABLE]: {}
            }
        };
        return new Promise((resolve, reject) => {
            let keys = [];
            data.forEach(pref => {
                let source = pref["_source"];
                if (count >= total) return;
                if (source.like === 1) {
                    if (count < total / 2) {
                        keys.push({
                            id: {S: source.restaurant_id}
                        })
                        count++;
                    } else if (shouldPick()) {
                        keys.push({
                            id: {S: source.restaurant_id}
                        });
                        count++;
                    }
                }
            });
            params.RequestItems[RESTAURANT_TABLE].Keys = getNonDuplicateKeys(keys);
            console.log(params);
            dynamodb.batchGetItem(params, (err, data) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                } else {
                    resolve(genResponse(data.Responses[RESTAURANT_TABLE]));
                }
            });
        })
    }

    function searchWithCategories(prefs) {
        let params = {
            RequestItems: {
                [RESTAURANT_TABLE]: {}
            }
        };
        return new Promise((resolve, reject) => {
            let keys = [];
            prefs.forEach(pref => {
                let source = pref["_source"];
                keys.push({
                    id: {S: source.restaurant_id}
                })
            });
            params.RequestItems[RESTAURANT_TABLE].Keys = getNonDuplicateKeys(keys);
            dynamodb.batchGetItem(params, (err, data) => {
                let category = "chinese";
                if (err) {
                    console.log(err);
                } else {
                    category = getMostPopularCategory(data.Responses[RESTAURANT_TABLE], prefs);
                }
                elasticSearchCategory(category).then(result => {
                    resolve(result);
                }).catch(err => {
                    reject(err);
                })
            });
        })
    }

    function elasticSearchCategory(category) {
        return new Promise((resolve, reject) => {
            let options = {
                index: 'predictions',
                type: 'prediction',
                body: {
                    query: {
                        term: {
                            category: category
                        }
                    },
                    size: 5
                }
            }
            client.search(options, (err, result) => {
                let hits = result.hits.hits;
                if (hits.length === 0) {
                    resolve([]);
                } else {
                    let params = genDynamoRequest(hits);
                    dynamodb.batchGetItem(params, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(genResponse(result.Responses[RESTAURANT_TABLE]));
                        }
                    })
                }
            })
        });
    }
    function getMostPopularCategory(data, prefs) {
        let votes = {};
        let prefMap = {};
        prefs.forEach(pref => {
            let source = pref["_source"];
            prefMap[source.restaurant_id] = {
                like: source.like
            }
        })
        data.forEach(restaurant => {
            const restaurant_id = restaurant.id.S;
            const category = restaurant.category.S;
            if (prefMap[restaurant_id]) {
                if (!votes[category]) {
                    votes[category] = 0;
                }
                if (prefMap[restaurant_id].like === 1) {
                    votes[category]++;
                } else {
                    votes[category]++;
                }
            }
        });

        let category = "";
        let count = -10000;
        for (let cate in votes) {
            if (votes[cate] > count) {
                category = cate;
                count = votes[cate];
            }
        }
        return category ? category : "chinese";
    }

    function shouldPick() {
        return Math.random() > 0.6;
    }

    function genResponse(data) {
        let result = [];
        data.forEach(restaurant => {
            result.push(genRestaurantInfo(restaurant));
        })
        return result;
    }

    function genRestaurantInfo(data) {
        let result = {};
        result.id = data.id.S;
        result.name = data.name.S;
        result.coordinate = {
            lat: data.lat.N,
            lng: data.lng.N
        };
        result.rating = data.rating ? data.rating.N : 0;
        result.review_count = data.review_count ? data.review_count.N : 0;
        result.image_url = data.image_url ? data.image_url.S : "";
        result.phone = data.phone ? data.phone.S : "no phone number";
        return result;
    }

    function genDynamoRequest(hits) {
        let keys = [];
        hits.forEach(hit => {
            keys.push({
                id: {S: hit['_source'].id}
            })
        });
        return {
            RequestItems: {
                [RESTAURANT_TABLE]: {
                    Keys: getNonDuplicateKeys(keys)
                }
            }
        };
    }

    function getNonDuplicateKeys(keys) {
        let seen = {};
        let result = [];
        keys.forEach(key => {
            if (!seen[key.id.S]) {
                result.push(key);
                seen[key.id.S] = true;
            }
        });
        return result;
    }
};