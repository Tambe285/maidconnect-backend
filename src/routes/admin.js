const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ==========================================
// 1. ADMIN LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Default credentials (You can change these in Render Environment Variables)
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Create a simple token
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      res.json({ 
        success: true, 
        token: token,
        message: 'Login successful' 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. BUSINESS APPLICATIONS ROUTE
// ==========================================
router.get('/business-applications', async (req, res) => {
  try {
    // Check for token (simple security check)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Fetch all business applications from waitlist table
    const result = await query(`
      SELECT * FROM waitlist 
      WHERE business_name IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, applications: result.rows });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// PATCH: Update Application Status
router.patch('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE waitlist SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    res.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = router;
