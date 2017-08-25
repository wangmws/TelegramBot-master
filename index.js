'use strict';

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var express = require('express');
var http = require('http');
var watson = require('watson-developer-cloud');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var request = require('request');

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const {converse} = require('./sagan');

// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

//Create Express app to serve client
var app = express();
//Create WebServer
var httpSrv = http.createServer(app);

//speech to text setup
var speech_to_text = watson.speech_to_text({
  username: process.env.STUserName,
  password: process.env.STPassword,
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api'
});

const textToSpeech = new TextToSpeechV1({
  // If unspecified here, the TEXT_TO_SPEECH_USERNAME and
  // TEXT_TO_SPEECH_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  username: process.env.TSUserName,
  password: process.env.TSPassword,
});


var params = {
  content_type: 'audio/ogg;codecs=opus',
  continuous: true,
  interim_results: false
};

console.log(process.env.TOKEN);
console.log(process.env.URL);
console.log(process.env.STUserName);
console.log(process.env.STPassword);


//Listen
httpSrv.listen(appEnv.port, '0.0.0.0', function() {
  console.log('server starting on ' + appEnv.url);
});

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
bot.setWebHook();

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  //console.log("onText");
  //console.log(msg);
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  //console.log("message");
  //console.log(msg);

  if(msg['voice']){ 
    //return onVoiceMessage(msg); 
    onVoiceMessage(msg); 
    
  }
  else{
  //console.log("msg : " + msg.text);
    converse(msg.text, (err, result) => {
      // Handle error case
      
      if (err) {
        switch (err.code) {
          case 'ETIMEDOUT':
            bot.reply(message, 'Cannot connect, please try later');
            bot.sendMessage(chatId, 'Cannot connect, please try later');
          break;
          default:
            bot.sendMessage(chatId, 'Cannot connect, please try later');
          break;
        }
      } else {
        // Send the text
        bot.sendMessage(chatId, result.speech.text);
        // Show card information if exists (based on card type)
        if (result.card) {
          if (result.card.type === '') {
            result.card.content.forEach(item => {
              bot.sendPhoto(chatId, item.image_url);
            });
          }
        }
      }
    });
  }
});

function onVoiceMessage(msg){
  var chatId = msg.chat.id;	
  bot.getFileLink(msg.voice.file_id).then(function(link){	
  	//setup new recognizer stream
  	var recognizeStream = speech_to_text.createRecognizeStream(params);
	  recognizeStream.setEncoding('utf8');
  	recognizeStream.on('results', function(data){
		if(data && data.results && data.results.length>0 && data.results[0].alternatives && data.results[0].alternatives.length>0){
			var msgText = data.results[0].alternatives[0].transcript;
      console.log("msgText: ", msgText);
      
      

      converse(msgText, (err, result) => {
        // Handle error case
        
        if (err) {
          switch (err.code) {
            case 'ETIMEDOUT':
              bot.reply(message, 'Cannot connect, please try later');
              bot.sendMessage(chatId, 'Cannot connect, please try later');
            break;
            default:
              bot.sendMessage(chatId, 'Cannot connect, please try later');
            break;
          }
        } else {
          // Send the text
          bot.sendMessage(chatId, result.speech.text);
          //Text to Speech
          var params = {};
          params["text"] = result.speech.text;
          const transcript = textToSpeech.synthesize(params);
          
          //console.log("Text to Speech");
          //console.log(transcript);

          bot.sendAudio(chatId,transcript,{caption: 'Watson Personal Assistance'});
                    
          // Show card information if exists (based on card type)
          if (result.card) {
            if (result.card.type === '') {
              result.card.content.forEach(item => {
                bot.sendPhoto(chatId, item.image_url);
              });
            }
          }
        }
      });
			
      //send speech recognizer result back to chat
      bot.sendMessage(chatId, msgText, {
				disable_notification: true,
				reply_to_message_id: msg.message_id
			}).then(function () {
          // reply sent!
         
      });
       
		}

	});
	['data', 'error', 'connection-close'].forEach(function(eventName){
	    recognizeStream.on(eventName, console.log.bind(console, eventName + ' event: '));
	});
	//pipe voice message to recognizer -> send to watson
  	request(link).pipe(recognizeStream);
  });
}
