const express = require('express');
const router = express.Router();
const { query } = require('../db'); // Ensure db.js exists in src folder

// GET Public Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaders = await query('SELECT name, type, total_referrals FROM promoters ORDER BY total_referrals DESC LIMIT 50');
    res.json({ success: true, leaderboard: leaders.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Register Promoter
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, type } = req.body;
    const promoter_code = 'MC' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    await query(
      'INSERT INTO promoters (name, email, phone, promoter_code, type) VALUES ($1, $2, $3, $4, $5)',
      [name, email, phone, promoter_code, type || 'promoter']
    );
    
    res.status(201).json({ success: true, message: 'Promoter registered', code: promoter_code });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PLACEHOLDER: Monthly Profit Calculation (We will add the real logic later)
router.post('/calculate-monthly-profit', async (req, res) => {
  res.json({ success: true, message: 'Monthly profit calculation logic goes here.' });
});

module.exports = router;
