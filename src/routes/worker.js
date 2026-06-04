const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET Public Worker Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const workers = await query(`
      SELECT name, service_type, city, average_rating, total_jobs_completed 
      FROM worker_profiles 
      ORDER BY average_rating DESC 
      LIMIT 50
    `);
    res.json({ success: true, leaderboard: workers.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST Calculate Yearly Profit (Placeholder)
router.post('/calculate-yearly-profit', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Yearly worker profit calculation endpoint ready' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
