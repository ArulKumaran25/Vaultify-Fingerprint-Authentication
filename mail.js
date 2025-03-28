const cors = require('cors');
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail, SendGrid)
  auth: {
    user: 'arulmvs4@gmail.com', // Your email
    pass: 'zocw ugdc dxir poig', // Your email password or app-specific password
  },
});

// Endpoint to send email
app.post('/send-email', (req, res) => { 
  const { toEmail, subject, message } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(toEmail)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  // Email options
  const mailOptions = {
    from: 'arulmvs4@gmail.com',
    to: toEmail,
    subject: subject,
    text: message,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, message: 'Failed to send email' });
    }
    console.log('Email sent:', info.response);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});