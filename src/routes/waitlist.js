const express = require('express');
const router = express.Router();
const { query } = require('../db');

// POST: Add to waitlist / business signup
router.post('/', async (req, res) => {
  try {
    const { name, phone, service, email, business_name, plan, promoter_code, city } = req.body;

    // Validate required fields
    if (!name || !phone || !service) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, phone, and service are required.' 
      });
    }

    // Insert into database (city is optional, defaults to 'Not specified')
    await query(`
      INSERT INTO waitlist (name, phone, service, email, business_name, plan, promoter_code, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [name, phone, service, email || null, business_name || null, plan || 'Starter', promoter_code || null, city || 'Not specified']);

    res.json({ 
      success: true, 
      message: 'Application submitted successfully!' 
    });

  } catch (error) {
    console.error('Waitlist Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET: Get all waitlist entries (Admin only)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM waitlist 
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, entries: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
