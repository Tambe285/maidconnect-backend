const express = require('express');
const router = express.Router();
const { query } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
    const token = jwt.sign({ adminId: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, admin: { name: admin.name, role: admin.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard (Protected)
router.get('/dashboard', async (req, res) => {
  try {
    // Simple stats
    const workers = await query('SELECT COUNT(*) FROM worker_profiles');
    const employers = await query('SELECT COUNT(*) FROM waitlist');
    res.json({ success: true, stats: { workers: workers.rows[0].count, employers: employers.rows[0].count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
