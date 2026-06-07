const express = require('express');
const router = express.Router();
const { query } = require('../db');
const bcrypt = require('bcrypt');

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, address, city } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    // Check duplicate
    const existing = await query(`SELECT id FROM customers WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(`
      INSERT INTO customers (full_name, email, phone, password_hash, address, city)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, full_name, email, phone, address, city, created_at
    `, [full_name, email, phone, passwordHash, address, city]);

    res.json({ success: true, message: 'Registration successful!', customer: result.rows[0] });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query(`SELECT * FROM customers WHERE email = $1`, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const customer = result.rows[0];
    const validPassword = await bcrypt.compare(password, customer.password_hash);
    
    if (!validPassword) {      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    delete customer.password_hash;
    res.json({ success: true, message: 'Login successful', customer: customer });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Verified Workers (Browse)
router.get('/workers', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, full_name, age, gender, skills, experience_years, 
             preferred_location, availability, average_rating, total_reviews
      FROM workers
      WHERE status = 'approved'
      ORDER BY average_rating DESC, created_at DESC
    `);
    res.json({ success: true, workers: result.rows });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Worker Details & Reviews
router.get('/workers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workerResult = await query(`
      SELECT id, full_name, age, gender, skills, experience_years, 
             preferred_location, availability, average_rating, total_reviews
      FROM workers WHERE id = $1 AND status = 'approved'
    `, [id]);

    if (workerResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Worker not found' });

    const reviewsResult = await query(`
      SELECT r.rating, r.comment, r.created_at, c.full_name as customer_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      WHERE r.worker_id = $1 ORDER BY r.created_at DESC LIMIT 10
    `, [id]);

    res.json({ success: true, worker: workerResult.rows[0], reviews: reviewsResult.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });  }
});

// Create Booking
router.post('/bookings', async (req, res) => {
  try {
    const { customer_id, worker_id, booking_date, booking_time, service_type, duration_hours, notes } = req.body;
    if (!customer_id || !worker_id || !booking_date || !booking_time || !service_type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const hourlyRate = 300; // Example rate
    const totalAmount = hourlyRate * (duration_hours || 1);

    const result = await query(`
      INSERT INTO bookings (customer_id, worker_id, booking_date, booking_time, service_type, duration_hours, total_amount, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `, [customer_id, worker_id, booking_date, booking_time, service_type, duration_hours || 1, totalAmount, notes]);

    res.json({ success: true, message: 'Booking created!', booking: result.rows[0] });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Customer Bookings
router.get('/bookings/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    const result = await query(`
      SELECT b.*, w.full_name as worker_name, w.phone as worker_phone
      FROM bookings b
      JOIN workers w ON b.worker_id = w.id
      WHERE b.customer_id = $1
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `, [customer_id]);
    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit Review
router.post('/reviews', async (req, res) => {
  try {
    const { customer_id, worker_id, booking_id, rating, comment } = req.body;
    if (!customer_id || !worker_id || !booking_id || !rating) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });    }
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'Rating must be 1-5' });

    const existing = await query(`SELECT id FROM reviews WHERE booking_id = $1`, [booking_id]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: 'Review already exists' });

    await query(`
      INSERT INTO reviews (customer_id, worker_id, booking_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
    `, [customer_id, worker_id, booking_id, rating, comment]);

    // Update average rating
    await query(`
      UPDATE workers SET 
        average_rating = (SELECT AVG(rating) FROM reviews WHERE worker_id = $1),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE worker_id = $1)
      WHERE id = $1
    `, [worker_id]);

    res.json({ success: true, message: 'Review submitted!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
