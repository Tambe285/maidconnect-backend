const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { query } = require('../db');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ==========================================
// CREATE PAYMENT ORDER
// ==========================================
router.post('/create-order', async (req, res) => {
  try {
    const { applicationId, amount, plan } = req.body;

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Convert to paise (Razorpay uses paise)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${applicationId}_${Date.now()}`,
      payment_capture: 1, // Auto-capture
      notes: {
        applicationId: applicationId,
        plan: plan || 'Business'
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({ 
      success: true, 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, error: error.message });  }
});

// ==========================================
// GENERATE PAYMENT LINK
// ==========================================
router.post('/generate-link', async (req, res) => {
  try {
    const { applicationId, amount, plan, customerEmail, customerName } = req.body;

    // Validate
    if (!amount || !customerEmail) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const amountInPaise = Math.round(amount * 100);

    // Create payment link
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountInPaise,
      currency: 'INR',
      accept_partial: false,
      expire_by: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      reference_id: `payment_${applicationId}_${Date.now()}`,
      description: `MaidConnect ${plan} Plan Subscription`,
      customer: {
        name: customerName || 'Business Owner',
        email: customerEmail,
        contact: '+919876543210' // You can get this from application
      },
      notify: {
        sms: false,
        email: true
      },
      reminder_enable: true,
      callback_url: `${process.env.FRONTEND_URL || 'https://maidconnect-backend-api.onrender.com'}/payment/success`,
      callback_method: 'get'
    });

    // Update application with payment link
    await query(
      `UPDATE waitlist SET payment_link = $1, payment_status = 'pending' WHERE id = $2`,
      [paymentLink.short_url, applicationId]
    );

    res.json({ 
      success: true, 
      paymentLink: paymentLink.short_url,
      paymentId: paymentLink.id
    });  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// VERIFY PAYMENT
// ==========================================
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    // Update application status
    await query(
      `UPDATE waitlist SET payment_status = 'paid', subscription_active = true, paid_at = NOW() WHERE id = $1`,
      [applicationId]
    );

    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// GET PAYMENT STATUS
// ==========================================
router.get('/status/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const result = await query(
      `SELECT payment_status, payment_link, subscription_active FROM waitlist WHERE id = $1`,      [applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ 
      success: true, 
      paymentStatus: result.rows[0].payment_status,
      paymentLink: result.rows[0].payment_link,
      subscriptionActive: result.rows[0].subscription_active
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
