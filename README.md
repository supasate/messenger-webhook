Messenger Webhook Demo
======================
## Test your webhook
1. Run the following on the command line to start your webhook on localhost:
```bash
node index.js
```
2. From a separate command line prompt, test your webhook verification by substituting your verify token into this cURL request:
```bash
curl -X GET "localhost:1337/webhook?hub.verify_token=<YOUR_VERIFY_TOKEN>&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe"
```
If your webhook verification is working as expected, you should see the following:
- WEBHOOK_VERIFIED logged to the command line where your node process is running.
- CHALLENGE_ACCEPTED logged to the command line where you sent the cURL request.

3. Test your webhook by sending this cURL request:
```bash
curl -H "Content-Type: application/json" -X POST "localhost:1337/webhook" -d '{"object": "page", "entry": [{"messaging": [{"message": "TEST_MESSAGE"}]}]}'
```
If your webhook is working as expected, you should see the following:
- TEST_MESSAGE logged to the command line where your node process is running.
- EVENT RECEIVED logged to the command line where you sent the cURL request.
