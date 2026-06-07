const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { query } = require('../db');

let razorpay;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (error) {
  console.error('Failed to init Razorpay');
}

router.post('/generate-link', async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ success: false, error: 'Payment not configured' });

    const { applicationId, amount, plan, customerEmail, customerName } = req.body;
    const amountInPaise = Math.round(amount * 100);
    
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountInPaise,
      currency: 'INR',
      accept_partial: false,
      expire_by: Date.now() + (7 * 24 * 60 * 60 * 1000),
      reference_id: `payment_${applicationId}_${Date.now()}`,
      description: `MaidConnect ${plan} Plan`,
      customer: { name: customerName, email: customerEmail, contact: '+919876543210' },
      notify: { sms: false, email: true },
      reminder_enable: true,
      callback_url: `${process.env.FRONTEND_URL}/payment/success`,
      callback_method: 'get'
    });

    await query(
      `UPDATE waitlist SET payment_link = $1, payment_status = 'pending' WHERE id = $2`,
      [paymentLink.short_url, applicationId]
    );

    res.json({ success: true, paymentLink: paymentLink.short_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_signature, applicationId } = req.body;
    // Simplified verification for now
    res.json({ success: true, message: 'Payment verified' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
