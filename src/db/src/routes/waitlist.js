const express = require('express');
const router  = express.Router();
const { query } = require('../db');

router.post('/', async (req, res) => {
  try {
    const { name, phone, role, city } = req.body;

    if (!name || !phone || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and role are required.'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Enter a valid 10-digit Indian mobile number.'
      });
    }

    if (!['employer', 'worker'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be employer or worker.'
      });
    }

    const result = await query(
      `INSERT INTO waitlist (name, phone, role, city)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone)
         DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city
       RETURNING id, name, phone, role, city, created_at`,
      [name.trim(), cleanPhone, role, city || null]
    );

    const entry = result.rows[0];
    const posResult = await query(
      `SELECT COUNT(*) as position FROM waitlist WHERE created_at <= $1`,
      [entry.created_at]
    );

    return res.status(201).json({
      success: true,
      message: "You're on the waitlist! We'll notify you when we launch.",
      data: {
        name: entry.name,
        role: entry.role,
        position: parseInt(posResult.rows[0].position),
      }
    });

  } catch (err) {
    console.error('[Waitlist] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*)                                      AS total,
        COUNT(*) FILTER (WHERE role = 'employer')     AS employers,
        COUNT(*) FILTER (WHERE role = 'worker')       AS workers,
        COUNT(DISTINCT city) FILTER (WHERE city IS NOT NULL) AS cities
      FROM waitlist
    `);
    const s = result.rows[0];
    return res.json({
      success: true,
      data: {
        total:     parseInt(s.total),
        employers: parseInt(s.employers),
        workers:   parseInt(s.workers),
        cities:    parseInt(s.cities),
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not fetch stats.' });
  }
});

module.exports = router;
