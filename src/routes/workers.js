const express = require('express');
const router = express.Router();
const { query } = require('../db');
const upload = require('../upload');
const { sendWorkerRegistrationEmail } = require('../emailService');

// Worker registration WITH file upload
router.post('/register', upload.fields([
  { name: 'aadhaar_front', maxCount: 1 },
  { name: 'aadhaar_back', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📥 Registration request received');
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);
    
    const { 
      full_name, phone, email, age, gender, 
      aadhaar_number, pan_number, skills, 
      experience_years, preferred_location, availability 
    } = req.body;

    if (!full_name || !phone || !email) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ success: false, error: 'Full name, phone, and email are required' });
    }

    // Parse skills - handle both string and array
    let skillsArray = [];
    if (skills) {
      if (typeof skills === 'string') {
        try {
          skillsArray = JSON.parse(skills);
        } catch (e) {
          skillsArray = skills.split(',').map(s => s.trim());
        }
      } else if (Array.isArray(skills)) {
        skillsArray = skills;
      }
    }

    // Get uploaded file URLs
    const documentUrls = [];
    if (req.files['aadhaar_front']) {
      documentUrls.push(`/uploads/${req.files['aadhaar_front'][0].filename}`);
    }
    if (req.files['aadhaar_back']) {
      documentUrls.push(`/uploads/${req.files['aadhaar_back'][0].filename}`);
    }    if (req.files['pan_card']) {
      documentUrls.push(`/uploads/${req.files['pan_card'][0].filename}`);
    }

    console.log('📝 Inserting worker into database...');
    
    const result = await query(`
      INSERT INTO workers (
        full_name, phone, email, age, gender, 
        aadhaar_number, pan_number, skills, 
        experience_years, preferred_location, availability, document_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      full_name, phone, email, age ? parseInt(age) : null, gender,
      aadhaar_number, pan_number, skillsArray,
      experience_years ? parseInt(experience_years) : 0, preferred_location, availability, documentUrls
    ]);

    console.log('✅ Worker registered successfully:', result.rows[0].id);
    console.log('📧 Attempting to send email to:', email);
    console.log('Email env vars loaded:', {
      user: process.env.EMAIL_USER ? '✓' : '✗',
      pass: process.env.EMAIL_PASS ? '✓ (length: ' + process.env.EMAIL_PASS.length + ')' : '✗'
    });

    // Send confirmation email with detailed logging
    sendWorkerRegistrationEmail(email, full_name)
      .then(result => {
        console.log('✅ Email send result:', result);
      })
      .catch(err => {
        console.error('❌ Failed to send registration email:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
      });

    res.json({ success: true, message: 'Registration successful!', worker: result.rows[0] });
  } catch (error) {
    console.error('❌ Error registering worker:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all workers (admin)
router.get('/all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;    if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const result = await query(`SELECT * FROM workers ORDER BY created_at DESC`);
    res.json({ success: true, workers: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update worker status (admin)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verified_by } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE workers SET status = $1, verified_by = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, verified_by || 'Admin', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    res.json({ success: true, worker: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
