const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { 
  logPromoterOnboarding, 
  getPromoterMonthlyProgress, 
  distributeMonthlyPool 
} = require('../utils/promoterPoolCalculator');

// 1. GET Dashboard Data
router.get('/dashboard', async (req, res) => {
  try {
    // TODO: In real app, get promoterId from logged-in user session/token
    // For now, we use a demo ID (1)
    const promoterId = req.query.id || 1; 
    
    const progress = await getPromoterMonthlyProgress(promoterId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET Earnings History
router.get('/earnings-history', async (req, res) => {
  try {
    const promoterId = req.query.promoterId || 1;
    
    const history = await query(`
      SELECT month, year, businesses_onboarded, share_percentage, payout_amount, paid
      FROM promoter_monthly_performance
      WHERE promoter_id = $1
      ORDER BY year DESC, month DESC
      LIMIT 6
    `, [promoterId]);
    
    res.json({ success: true, history: history.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST Log a New Onboarding (Used by Business Signup flow)
router.post('/onboard-business', async (req, res) => {
  try {
    const { promoterId, businessId, businessType, plan, revenue } = req.body;
    
    await logPromoterOnboarding(promoterId, businessId, businessType, plan, revenue);
    
    res.json({ 
      success: true, 
      message: 'Business successfully onboarded and credited to promoter!' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST Trigger Pool Distribution (Admin Only)
router.post('/distribute-pool', async (req, res) => {
  try {
    const { month, year } = req.body;
    const result = await distributeMonthlyPool(month, year);
    res.json({ success: true, message: 'Pool distributed successfully', data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
