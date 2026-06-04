const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET Public Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const workers = await query('SELECT name, service_type, city, average_rating FROM worker_profiles ORDER BY average_rating DESC LIMIT 50');
    res.json({ success: true, leaderboard: workers.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PLACEHOLDER: Yearly Profit Calculation
router.post('/calculate-yearly-profit', async (req, res) => {
  res.json({ success: true, message: 'Yearly worker profit logic goes here.' });
});

module.exports = router;
