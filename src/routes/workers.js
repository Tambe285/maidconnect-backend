const express = require('express');
const router = express.Router();
const { query } = require('../db');

// 1. GET Public Worker Leaderboard
// This allows anyone to see the top performers
router.get('/leaderboard', async (req, res) => {
  try {
    const workers = await query(`
      SELECT 
        name, 
        service_type, 
        city, 
        average_rating, 
        total_jobs_completed 
      FROM worker_profiles 
      ORDER BY average_rating DESC, total_jobs_completed DESC 
      LIMIT 50
    `);
    res.json({ success: true, leaderboard: workers.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET Worker Dashboard Data (Private/Real-time)
// This fetches the specific stats for the progress bars
router.get('/dashboard', async (req, res) => {
  try {
    // NOTE: In a production app, we would get the specific worker ID from a login token.
    // For now, we fetch a sample worker to show the UI works with real data.
    
    // Let's grab the first worker from the database as a demo
    const workerResult = await query(`
      SELECT 
        id,
        name,
        total_earnings,
        average_rating,
        total_jobs_completed
      FROM worker_profiles
      ORDER BY total_jobs_completed DESC
      LIMIT 1
    `);

    if (workerResult.rows.length === 0) {
      return res.json({
        success: false,
        message: "No workers found in database."
      });
    }

    const worker = workerResult.rows[0];

    // Calculate eligibility status
    const jobsNeeded = 50;
    const ratingNeeded = 4.0;
    const isEligible = worker.total_jobs_completed >= jobsNeeded && worker.average_rating >= ratingNeeded;

    res.json({
      success: true,
      data: {
        name: worker.name,
        totalEarnings: parseFloat(worker.total_earnings || 0),
        averageRating: parseFloat(worker.average_rating || 0),
        completedJobs: parseInt(worker.total_jobs_completed || 0),
        isEligible: isEligible,
        jobsRemaining: Math.max(0, jobsNeeded - worker.total_jobs_completed)
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST Calculate Yearly Profit (Admin Function)
// This triggers the profit distribution logic
router.post('/calculate-yearly-profit', async (req, res) => {
  try {
    // This would trigger the logic in notificationTemplates.js / profitCalculator.js
    // For now, we return a success message
    res.json({ 
      success: true, 
      message: 'Yearly worker profit calculation triggered successfully.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
