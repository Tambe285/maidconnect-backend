const nodemailer = require('nodemailer');

// Create the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send approval email
const sendApprovalEmail = async (to, businessName, contactName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: '🎉 Welcome to MaidConnect - Application Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: #F97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Welcome to MaidConnect!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Hi ${contactName},</p>
          <p>Great news! Your business application for <strong>${businessName}</strong> has been <strong style="color: green;">Approved</strong>.</p>
          <p>Our team will contact you shortly to help you get started.</p>
          <br>
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
  }
};

// Send rejection email
const sendRejectionEmail = async (to, businessName, contactName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'MaidConnect Application Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Application Update</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Hi ${contactName},</p>
          <p>Thank you for applying to MaidConnect.</p>
          <p>After review, we are unable to approve the application for <strong>${businessName}</strong> at this time.</p>
          <p>If you have questions, please contact support.</p>
          <br>
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Rejection email sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
  }
};

module.exports = { sendApprovalEmail, sendRejectionEmail };
