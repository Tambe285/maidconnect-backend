const express = require('express');
const router = express.Router();
const { query } = require('../db');
// const { 
//   sendWorkerRegistrationEmail, 
//   sendWorkerStatusEmail 
// } = require('../utils/emailService');

// ==========================================
// WORKER REGISTRATION
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { 
      full_name, phone, email, age, gender, 
      aadhaar_number, pan_number, skills, 
      experience_years, preferred_location, availability, document_urls 
    } = req.body;

    if (!full_name || !phone || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Full name, phone, and email are required' 
      });
    }

    const result = await query(`
      INSERT INTO workers (
        full_name, phone, email, age, gender, 
        aadhaar_number, pan_number, skills, 
        experience_years, preferred_location, availability, document_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      full_name, phone, email, age, gender,
      aadhaar_number, pan_number, skills || [],
      experience_years || 0, preferred_location, availability, document_urls || []
    ]);

    // Send confirmation email
    sendWorkerRegistrationEmail(email, full_name);

    res.json({ 
      success: true, 
      message: 'Registration successful! Check your email for confirmation.',
      worker: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering worker:', error);
    res.status(500).json({ success: false, error: error.message });  }
});

// ==========================================
// GET ALL WORKERS (ADMIN)
// ==========================================
router.get('/all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(`
      SELECT * FROM workers 
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, workers: result.rows });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// UPDATE WORKER STATUS (ADMIN)
// ==========================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verified_by } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Get worker details first to send email
    const currentWorker = await query(`SELECT * FROM workers WHERE id = $1`, [id]);
    
    if (currentWorker.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    const worker = currentWorker.rows[0];

    // Update status
    const result = await query(
      `UPDATE workers SET status = $1, verified_by = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, verified_by || 'Admin', id]    );

    // Send status update email
    sendWorkerStatusEmail(worker.email, worker.full_name, status);

    res.json({ success: true, worker: result.rows[0] });
  } catch (error) {
    console.error('Error updating worker status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
