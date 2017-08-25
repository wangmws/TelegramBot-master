'use strict';

const request = require('request');

function converse(text, callback) {
  request.post({
    url: `${process.env.URL}/v1/api/converse?api_key=263a63f6-4e5e-4a6e-b59b-962050b3e7b0`,
    json: {
      'id': 'alexa',
      'version': '1.0',
      'language': 'en-US',
      'text': text,
      'context': {
        'user': {
          'id': 'Shawn'
        },
        'application': {
          'id': 'ShawnApp',
          'attributes': {}
        }
      }
    }
  }, function(err, response, body) {
    /*
    console.log("err:");
    console.log(err);
    console.log("response:");
    console.log(response);
    console.log("body:");
    console.log(body);
    */
    //if (err || (body.speech === undefined)) {
    if (err || (body === undefined)) {
      callback('no response');
    } else {
      callback(null, body);
    }
  });
}

module.exports = {
  converse: converse
};

// converse('hi', (err, result) => {
//   console.log(result);
// });
