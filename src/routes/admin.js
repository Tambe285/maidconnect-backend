const express = require('express');
const router = express.Router();
const { query } = require('../db');
// Import the email functions we just created
const { sendApprovalEmail, sendRejectionEmail } = require('../email');

// ==========================================
// 1. ADMIN LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Default credentials
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
// 3. UPDATE APPLICATION STATUS & SEND EMAIL
// ==========================================
router.patch('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    // 1. Check current status so we don't spam emails
    const currentResult = await query(`SELECT status FROM waitlist WHERE id = $1`, [id]);
    const currentStatus = currentResult.rows[0]?.status;

    // If status isn't changing, do nothing
    if (currentStatus === status) {
      return res.json({ success: true, message: 'Status unchanged' });
    }

    // 2. Update the status in database
    const result = await query(
      `UPDATE waitlist SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    const application = result.rows[0];

    // 3. Send Email based on new status
    if (status === 'approved') {
      // Fire and forget (don't wait for email to finish before responding)
      sendApprovalEmail(application.email, application.business_name, application.name);
    } else if (status === 'rejected') {
      sendRejectionEmail(application.email, application.business_name, application.name);
    }

    res.json({ success: true, application: application });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
