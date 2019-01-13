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
  if (receivedMessage.text) {
    // Create the payload for a basic text message
    response = {
      text: `You send the message "${receivedMessage.text}". Now send me an image!`,
    };
  } else if (receivedMessage.attachments) {
    // Get the URL of the message attachment
    const attachmentUrl = receivedMessage.attachments[0].payload.url;
    response = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'Is this the right picture?',
            subtitle: 'Tap a button to answer.',
            image_url: attachmentUrl,
            buttons: [
              {
                type: 'postback',
                title: 'Yes!',
                payload: 'yes',
              },
              {
                type: 'postback',
                title: 'No!',
                payload: 'no',
              },
            ],
          }],
        },
      },
    };
  }

  // Send the response message
  callSendAPI(senderPsid, response);
}


// Handle messaging_postbacks events
function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Get the payload for the postback
  const payload = receivedPostback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { text: 'Thanks!' };
  } else if (payload === 'no') {
    response = { text: 'Oops, try sending another image.' };
  }

  // Send the message to acknowledge the postback
  callSendAPI(senderPsid, response);
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
      console.log('entry', entry);
      let webhookEvent;

      if (entry.messaging) {
        // If this app is a primary receiver, it will receive a messaging event.
        // Get the message. entry.messaging is an array, but
        // will only ever contain one message, so, we get index 0
        webhookEvent = entry.messaging[0];
      } else if (entry.standby) {
        // If this app is a secondary receiver, it will receive a standby event.
        // Get the message. entry.standby is an array, but
        // will only ever contain one message, so, we get index 0
        webhookEvent = entry.standby[0];
      }
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
