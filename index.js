'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());
const request = require('request');

const PORT = process.env.PORT || 1337
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Handle messages events
function handleMessage(senderPsid, receivedMessage) {
  let response;

  // Check if the message contains text
  console.log('receivedMessage', receivedMessage);
  if (receivedMessage.text) {
    // Create the payload for a basic text message
    response = {
      text: `You send the message "${receivedMessage.text}". Now send me an image!`,
    };
  }

  // Send the response message
  console.log('response', response);
  callSendAPI(senderPsid, response);
}


// Handle messaging_postbacks events
function handlePostback(senderPsid, receivedPostback) {
  console.log('receivedPostback', receivedPostback);
}

// Send response messages via the Send API
function callSendAPI(senderPsid, response) {
  // Construct the message body
  const requestBody = {
    recipient: {
      id: senderPsid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: PAGE_ACCESS_TOKEN,
    },
    method: 'POST',
    json: requestBody,
  }, (err, res, body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}


// Create the endpoint for our webhook
app.post('/webhook', (req, res) => {
  console.log('Receive a POST request');
  const body = req.body;
  // Check if this is an event from a page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach((entry) => {
      // Get the message. entry.messaging is an array, but
      // will only ever contain one message, so, we get index 0
      const webhookEvent = entry.messaging[0];
      console.log('webhookEvent', webhookEvent);

      // Get the sender PSID
      const senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID: ' + senderPsid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    // Return a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Add support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN';

  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode is in the query string of the request
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    // Respond with the challenge token from the request
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    // Respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.listen(PORT, () => console.log(`Messenger webhook is listening at ${PORT}`));
