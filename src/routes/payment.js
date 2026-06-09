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

// 1. Initiate Booking & Create Order
router.post('/initiate-booking', async (req, res) => {
  try {
    const { customer_id, worker_id, booking_date, booking_time, service_type, duration_hours, notes } = req.body;

    // Calculate amount (Example: ₹300 per hour)
    const hourlyRate = 300;
    const totalAmount = hourlyRate * duration_hours;

    // Create Razorpay Order
    const options = {
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_booking_${Date.now()}`,
      notes: {
        customer_id,
        worker_id,
        service_type,
        duration_hours
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Verify Payment & Confirm Booking
router.post('/confirm-booking', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      customer_id, 
      worker_id, 
      booking_date, 
      booking_time, 
      service_type, 
      duration_hours, 
      notes 
    } = req.body;

    // Verify Signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    // Payment Verified! Create Booking in Database
    const hourlyRate = 300;
    const totalAmount = hourlyRate * duration_hours;

    const result = await query(`
      INSERT INTO bookings (
        customer_id, worker_id, booking_date, booking_time, service_type, 
        duration_hours, total_amount, notes, status, payment_status, 
        razorpay_order_id, razorpay_payment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'paid', $9, $10)
      RETURNING *
    `, [
      customer_id, worker_id, booking_date, booking_time, service_type,
      duration_hours, totalAmount, notes, razorpay_order_id, razorpay_payment_id
    ]);

    res.json({ success: true, message: 'Booking confirmed!', booking: result.rows[0] });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
