const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { sendWorkerApprovalEmail, sendWorkerRejectionEmail, sendBusinessRegistrationEmail } = require('../emailService');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      res.json({ success: true, token, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/business-applications', requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM waitlist ORDER BY created_at DESC`);
    res.json({ success: true, applications: result.rows });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/applications/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const current = await query(`SELECT * FROM waitlist WHERE id = $1`, [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }    const result = await query(
      `UPDATE waitlist SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/workers', requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM workers ORDER BY created_at DESC`);
    res.json({ success: true, workers: result.rows });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/workers/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const result = await query(
      `UPDATE workers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    res.json({ success: true, worker: result.rows[0] });
  } catch (error) {
    console.error('Error updating worker status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [apps, workers, promoters] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='pending' THEN 1 END) as pending, COUNT(CASE WHEN status='approved' THEN 1 END) as approved FROM waitlist`),
      query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='pending' THEN 1 END) as pending, COUNT(CASE WHEN status='approved' THEN 1 END) as approved FROM workers`),
      query(`SELECT COUNT(*) as total FROM promoters`)
    ]);
    res.json({      success: true,
      stats: {
        applications: apps.rows[0],
        workers: workers.rows[0],
        promoters: promoters.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
