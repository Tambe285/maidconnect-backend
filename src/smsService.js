const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS function
const sendSMS = async (to, message) => {
  try {
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

module.exports = {
  sendSMS,
  sendWorkerRegistrationSMS,
  sendWorkerApprovalSMS,
  sendWorkerRejectionSMS
};
