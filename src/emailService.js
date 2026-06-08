const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS function
const sendSMS = async (to, message) => {
  try {
    // Format phone number (ensure it starts with +)
    const formattedNumber = to.startsWith('+') ? to : `+91${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log('✅ SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

// Worker Registration SMS
const sendWorkerRegistrationSMS = async (phone, workerName) => {
  const message = `Hi ${workerName}! Welcome to MaidConnect. Your registration is received. Our team will verify your documents within 24-48 hours. Thanks!`;
  return sendSMS(phone, message);
};

// Worker Approval SMS
const sendWorkerApprovalSMS = async (phone, workerName) => {
  const message = `Congratulations ${workerName}! Your MaidConnect profile is APPROVED. You're now live and customers can book your services. Start earning!`;
  return sendSMS(phone, message);
};

// Worker Rejection SMS
const sendWorkerRejectionSMS = async (phone, workerName, reason = '') => {
  const message = `Hi ${workerName}, we couldn't approve your MaidConnect application.${reason ? ' Reason: ' + reason : ''} You can reapply after fixing the issue.`;
  return sendSMS(phone, message);
};

// Booking Confirmation SMS
const sendBookingConfirmationSMS = async (phone, customerName, workerName, date, time) => {
  const message = `Hi ${customerName}! Your booking with ${workerName} is confirmed for ${date} at ${time}. We'll send a reminder before the service.`;
  return sendSMS(phone, message);
};

// OTP Verification SMS
const sendOTPSMS = async (phone, otp) => {
  const message = `Your MaidConnect OTP is: ${otp}. Valid for 10 minutes. Don't share this with anyone.`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendWorkerRegistrationSMS,
  sendWorkerApprovalSMS,
  sendWorkerRejectionSMS,
  sendBookingConfirmationSMS,
  sendOTPSMS
};
