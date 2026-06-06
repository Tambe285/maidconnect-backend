const express = require('express');
const router = express.Router();
const { query } = require('../db');

// ==========================================
// 1. ADMIN LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
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
// 2. GET ALL APPLICATIONS
// ==========================================
router.get('/business-applications', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

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

// ==========================================
// 3. UPDATE APPLICATION STATUS
// ==========================================
router.patch('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const currentResult = await query(`SELECT status FROM waitlist WHERE id = $1`, [id]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    const currentStatus = currentResult.rows[0].status;

    if (currentStatus === status) {
      return res.json({ success: true, message: 'Status unchanged' });
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
