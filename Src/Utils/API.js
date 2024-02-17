const { decrypt } = require('./helper.js');
const axios = require('axios');
const crypto = require('crypto');

async function publish_message(universeId, message) {
    const base_url = 'https://apis.roblox.com/messaging-service/v1/universes/';
    const apiKey = null;
    const topic = 'DTR';
    const object_url = base_url + universeId + '/topics/' + topic;

    const params = {
        "message": message
    };

    const response = await axios.post(object_url, params, 
        {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
    }).catch(err => {
        if (err.response.status == 401) throw new Error('API key not valid for operation, user does not have authorization');
        if (err.response.status == 403) throw new Error('Publish is not allowed on universe.');
        if (err.response.status == 500) throw new Error('Server internal error / Unknown error.');
        if (err.response.status == 400){
            if (err.response.data == "requestMessage cannot be longer than 1024 characters. (Parameter 'requestMessage')") throw new Error('The request message cannot be longer then 1024 characters long.');
            console.log(err.response.data);
        }
    });

    if (response){
        if (response.status == 200) return 'Message successfully sent!';
        if (response.status != 200) throw new Error('An unknown issue has occurred.');
    };

    return response.data;
};

async function set_entry(secret, universeId, datastore, object_key, value, scope = null) {
    const base_url = 'https://apis.roblox.com/datastores/v1/universes/';
    const apiKey = decrypt(secret);
    const objects_url = base_url + universeId + '/standard-datastores/datastore/entries/entry';
    let errorState = null;

    const params = {
        'datastoreName': datastore,
        'entryKey': object_key
    };
    if (scope) {
        params["scope"] = scope;
    };
    
    const JSONValue = await JSON.stringify(value);
    const ConvertAdd = await crypto.createHash('md5').update(JSONValue).digest("base64");
    const response = await axios.post(
        `${objects_url}`,
        300,
        { params, headers: {
            'x-api-key': apiKey,
            'content-md5': ConvertAdd,
            'content-type': 'application/json'
        }}
    ).catch(err => {
        errorState = err.response.data;
    });

    if (response && response.data) {
        return { state: true, info: response.data };
    };

    return { state: false, info: `${response && response.data || errorState}` };
};

module.exports = { publish_message, set_entry };