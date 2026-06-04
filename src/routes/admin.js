const express = require('express');
const router = express.Router();
const { query } = require('../db'); // Uses src/db.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import the profit calculator we just created
const { calculateMonthlyPromoterProfit, calculateYearlyWorkerProfit } = require('../utils/profitCalculator');

// --- 1. LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
    const token = jwt.sign({ adminId: admin.id, role: admin.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    res.json({ success: true, token, admin: { name: admin.name, role: admin.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 2. DASHBOARD STATS ---
router.get('/dashboard', async (req, res) => {
  try {
    const workers = await query('SELECT COUNT(*) FROM worker_profiles');
    const employers = await query('SELECT COUNT(*) FROM waitlist');
    const promoters = await query('SELECT COUNT(*) FROM promoters');
    
    res.json({ 
      success: true, 
      stats: { 
        workers: workers.rows[0].count, 
        employers: employers.rows[0].count,
        promoters: promoters.rows[0].count
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 3. TRIGGER MONTHLY PROMOTER PROFIT ---
// This is the magic button!
router.post('/calculate-monthly-promoter-profit', async (req, res) => {
  try {
    // Example: trigger for June 2026
    const { year = 2026, month = 6 } = req.body; 
    console.log(`Admin triggered monthly profit calc for ${year}-${month}`);
    
    const result = await calculateMonthlyPromoterProfit(year, month);
    res.json({ success: true, message: 'Promoter profit calculated successfully!', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 4. TRIGGER YEARLY WORKER PROFIT ---
// The other magic button!
router.post('/calculate-yearly-worker-profit', async (req, res) => {
  try {
    const { year = 2026 } = req.body;
    console.log(`Admin triggered yearly profit calc for ${year}`);
    
    const result = await calculateYearlyWorkerProfit(year);
    res.json({ success: true, message: 'Worker profit calculated successfully!', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
