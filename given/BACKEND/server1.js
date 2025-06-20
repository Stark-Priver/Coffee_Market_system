const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Twilio } = require('twilio');

const app = express();
const PORT = process.env.PORT || 3001;

// Replace these with your Twilio account details or set as environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890'; // Your Twilio phone number

const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.use(cors());
app.use(bodyParser.json());

// Health check route
app.get('/', (req, res) => {
  res.send('Customer Feedback Backend is running');
});

// Send SMS route
app.post('/send-sms', async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'phoneNumber and message are required' });
  }

  try {
    const sms = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log('SMS sent:', sms.sid);
    res.json({ success: true, sid: sms.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit feedback route (you can extend to save in DB)
app.post('/submit-feedback', (req, res) => {
  const feedback = req.body;

  // For now just log feedback. You can integrate with a database here.
  console.log('Received feedback:', feedback);

  // Respond with success
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
