const twilio = require('twilio');
const client = twilio('YOUR_TWILIO_SID', 'YOUR_TWILIO_AUTH_TOKEN');

client.messages.create({
  body: 'Test message from script!',
  from: '+19472107506',    // Example: '+12345678900'
  to: '+255755402743'                  // ✅ Replace this with your real number
}).then(message => console.log('Message SID:', message.sid))
  .catch(error => console.error('SMS Error:', error));
