'use strict';

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const {converse} = require('./sagan');

// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

console.log(process.env.TOKEN);
console.log(process.env.URL);
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  console.log("onText");
  console.log(msg);
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
  console.log("message");
  console.log(msg);
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

});
