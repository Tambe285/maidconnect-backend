const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

// 1. Worker Registration Confirmation
const sendWorkerRegistrationEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to MaidConnect - Registration Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: #F97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Welcome to MaidConnect!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Hi ${name},</p>
          <p>Thank you for registering as a worker on MaidConnect.</p>
          <p>We have received your application and our team is currently reviewing your details.</p>
          <p>We will contact you within 24-48 hours once your profile is verified.</p>
          <br>
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Worker registration email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending worker registration email:', error);
  }
};

// 2. Worker Application Status Update
const sendWorkerStatusEmail = async (email, name, status) => {
  const isApproved = status === 'approved';
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: isApproved ? 'Congratulations! You are Verified on MaidConnect' : 'MaidConnect Application Update',
    html: `      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: ${isApproved ? '#10B981' : '#EF4444'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">${isApproved ? 'Application Approved!' : 'Application Update'}</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Hi ${name},</p>
          ${isApproved 
            ? '<p>Great news! Your profile has been <strong>verified and approved</strong>. You can now start receiving job requests from customers.</p>' 
            : '<p>We regret to inform you that your application has been <strong>rejected</strong> at this time. Please re-apply with correct details if applicable.</p>'}
          <br>
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Worker status email (${status}) sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending worker status email:', error);
  }
};

// 3. Business Application Approval
const sendBusinessApprovalEmail = async (email, businessName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Congratulations! Your Business is Approved - MaidConnect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: #F97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Welcome to MaidConnect!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Hi ${businessName},</p>
          <p>Your business application has been <strong>Approved</strong>.</p>
          <p>Please proceed with the payment to activate your subscription and start accessing our verified workforce.</p>
          <br>
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Business approval email sent to ${email}`);
  } catch (error) {    console.error('❌ Error sending business approval email:', error);
  }
};

// 4. Payment Confirmation Receipt
const sendPaymentReceiptEmail = async (email, businessName, amount, plan) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Payment Successful - ${plan} Plan Activated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Payment Successful!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Hi ${businessName},</p>
          <p>Thank you for your payment of <strong>₹${amount}</strong>.</p>
          <p>Your <strong>${plan} Plan</strong> subscription is now active.</p>
          <p>You can now start posting jobs and accessing our verified workforce.</p>
          <br>
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment receipt sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending payment receipt:', error);
  }
};

module.exports = {
  sendWorkerRegistrationEmail,
  sendWorkerStatusEmail,
  sendBusinessApprovalEmail,
  sendPaymentReceiptEmail
};
