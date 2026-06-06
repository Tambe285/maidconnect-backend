const express = require('express');
const router = express.Router();
const { query } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// TEMPORARILY DISABLED - Profit calculator will be added later
// const { calculateMonthlyPromoterProfit, calculateYearlyWorkerProfit } = require('../utils/profitCalculator');

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

// --- 3. PROFIT STATS (Simple version) ---
router.get('/profit-stats', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profit sharing system coming soon',
      pendingPromoterPayouts: 0,
      pendingWorkerPayouts: 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 4. PLACEHOLDER ROUTES FOR PROFIT CALCULATION ---
// These will be enabled once profitCalculator.js is properly set up

router.post('/calculate-monthly-promoter-profit', async (req, res) => {
  try {
    // TEMPORARY PLACEHOLDER
    res.json({ 
      success: true, 
      message: 'Monthly promoter profit calculation will be available soon',
      data: {
        totalRevenue: 0,
        promoterPool: 0,
        totalPromoters: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate-yearly-worker-profit', async (_req, res) => {
  try {
    // TEMPORARY PLACEHOLDER
    res.json({ 
      success: true, 
      message: 'Yearly worker profit calculation will be available soon',
      data: {
        totalProfit: 0,
        workerPool: 0,
        totalWorkers: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Get all business applications
router.get('/business-applications', async (_req, res) => {
  try {
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
module.exports = router;
