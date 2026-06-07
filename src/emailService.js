const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"MaidConnect" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Worker Registration Confirmation
const sendWorkerRegistrationEmail = async (workerEmail, workerName) => {
  const subject = 'Welcome to MaidConnect - Registration Successful';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f97316; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
      </style>
    </head>
    <body>      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">MaidConnect</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${workerName}!</h2>
          <p>Thank you for registering with MaidConnect. Your application has been received successfully.</p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Our team will verify your documents within <strong>24-48 hours</strong></li>
            <li>You'll receive an email once your profile is approved</li>
            <li>After approval, customers will be able to view and book your services</li>
          </ul>
          
          <p>If you have any questions, feel free to contact us.</p>
          
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
        <div class="footer">
          <p>© 2026 MaidConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(workerEmail, subject, html);
};

// Worker Approval Email
const sendWorkerApprovalEmail = async (workerEmail, workerName) => {
  const subject = 'Congratulations! Your MaidConnect Profile is Approved';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; margin: 10px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎉 Profile Approved!</h1>        </div>
        <div class="content">
          <h2>Congratulations, ${workerName}!</h2>
          <p>Great news! Your profile has been <span class="badge">APPROVED</span> by our verification team.</p>
          
          <h3>You're Now Live!</h3>
          <p>Your profile is now visible to customers on MaidConnect. They can browse your skills, experience, and book your services.</p>
          
          <ul>
            <li>✅ Your profile is now active on our platform</li>
            <li>✅ Customers can view your skills and ratings</li>
            <li>✅ You'll receive booking requests directly</li>
          </ul>
          
          <p>Thank you for being part of MaidConnect!</p>
          
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
        <div class="footer">
          <p>© 2026 MaidConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(workerEmail, subject, html);
};

// Worker Rejection Email
const sendWorkerRejectionEmail = async (workerEmail, workerName, reason = '') => {
  const subject = 'Update on Your MaidConnect Application';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Application Update</h1>
        </div>
        <div class="content">          <h2>Dear ${workerName},</h2>
          <p>Thank you for your interest in joining MaidConnect.</p>
          
          <p>After reviewing your application, we regret to inform you that we cannot approve it at this time.</p>
          
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          <p>You're welcome to reapply after addressing the above concern.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
        <div class="footer">
          <p>© 2026 MaidConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(workerEmail, subject, html);
};

// Business Registration Email
const sendBusinessRegistrationEmail = async (businessEmail, businessName, ownerName) => {
  const subject = 'Welcome to MaidConnect Business Portal';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to MaidConnect</h1>
        </div>
        <div class="content">
          <h2>Hello ${ownerName},</h2>
          <p>Thank you for registering <strong>${businessName}</strong> with MaidConnect.</p>
          
          <h3>Next Steps:</h3>
          <ol>            <li>Our team will review your application</li>
            <li>You'll receive a payment link for your chosen plan</li>
            <li>Once payment is confirmed, your account will be activated</li>
          </ol>
          
          <p>We'll be in touch soon!</p>
          
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
        <div class="footer">
          <p>© 2026 MaidConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(businessEmail, subject, html);
};

// Booking Confirmation Email
const sendBookingConfirmationEmail = async (customerEmail, customerName, workerName, bookingDate, bookingTime) => {
  const subject = 'Booking Confirmed - MaidConnect';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Booking Confirmed! ✅</h1>
        </div>
        <div class="content">
          <h2>Hi ${customerName},</h2>
          <p>Your booking has been confirmed successfully.</p>
          
          <div class="booking-details">
            <h3 style="margin-top: 0;">Booking Details:</h3>
            <div class="detail-row">              <span><strong>Worker:</strong></span>
              <span>${workerName}</span>
            </div>
            <div class="detail-row">
              <span><strong>Date:</strong></span>
              <span>${bookingDate}</span>
            </div>
            <div class="detail-row">
              <span><strong>Time:</strong></span>
              <span>${bookingTime}</span>
            </div>
          </div>
          
          <p>We'll send you a reminder before the scheduled time.</p>
          
          <p>Thank you for choosing MaidConnect!</p>
          
          <p>Best regards,<br>The MaidConnect Team</p>
        </div>
        <div class="footer">
          <p>© 2026 MaidConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(customerEmail, subject, html);
};

module.exports = {
  sendWorkerRegistrationEmail,
  sendWorkerApprovalEmail,
  sendWorkerRejectionEmail,
  sendBusinessRegistrationEmail,
  sendBookingConfirmationEmail
};
