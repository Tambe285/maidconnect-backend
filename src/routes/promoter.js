const express = require('express');
const router = express.Router();
const { query } = require('../db');
const crypto = require('crypto');

function generatePromoterCode() {
  return 'PROMO' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Promoter registration
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    if (!full_name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Full name, email, and phone are required' });
    }

    let promoterCode = generatePromoterCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await query(`SELECT id FROM promoters WHERE promoter_code = $1`, [promoterCode]);
      if (existing.rows.length === 0) isUnique = true;
      else promoterCode = generatePromoterCode();
    }

    const result = await query(`
      INSERT INTO promoters (full_name, email, phone, promoter_code)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [full_name, email, phone, promoterCode]);

    res.json({ success: true, message: 'Promoter registration successful!', promoter: result.rows[0] });
  } catch (error) {
    console.error('Error registering promoter:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Promoter dashboard
router.get('/dashboard/:promoterCode', async (req, res) => {
  try {
    const { promoterCode } = req.params;
    const promoterResult = await query(`SELECT * FROM promoters WHERE promoter_code = $1`, [promoterCode.toUpperCase()]);
    if (promoterResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Promoter not found' });

    const promoter = promoterResult.rows[0];
    const referralsResult = await query(`
      SELECT r.*, w.business_name, w.email as business_email, w.phone as business_phone, w.payment_status
      FROM referrals r
      LEFT JOIN waitlist w ON r.business_id = w.id
      WHERE r.promoter_id = $1 ORDER BY r.created_at DESC    `, [promoter.id]);

    const totalReferrals = referralsResult.rows.length;
    const successfulReferrals = referralsResult.rows.filter(r => r.status === 'paid').length;
    const pendingReferrals = referralsResult.rows.filter(r => r.status === 'pending').length;

    res.json({
      success: true,
      promoter: { ...promoter, totalReferrals, successfulReferrals, pendingReferrals, totalEarnings: promoter.total_earnings || 0 },
      referrals: referralsResult.rows
    });
  } catch (error) {
    console.error('Error fetching promoter dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track referral (called when business applies)
router.post('/track', async (req, res) => {
  try {
    const { promoterCode, businessId } = req.body;
    if (!promoterCode || !businessId) return res.status(400).json({ success: false, error: 'Promoter code and business ID required' });

    const promoterResult = await query(`SELECT id FROM promoters WHERE promoter_code = $1`, [promoterCode.toUpperCase()]);
    if (promoterResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Invalid promoter code' });

    const promoterId = promoterResult.rows[0].id;
    const existing = await query(`SELECT id FROM referrals WHERE promoter_id = $1 AND business_id = $2`, [promoterId, businessId]);
    if (existing.rows.length > 0) return res.json({ success: true, message: 'Referral already tracked' });

    await query(`INSERT INTO referrals (promoter_id, business_id, referral_code, status) VALUES ($1, $2, $3, 'pending')`, [promoterId, businessId, promoterCode.toUpperCase()]);
    await query(`UPDATE promoters SET total_referrals = total_referrals + 1 WHERE id = $1`, [promoterId]);

    res.json({ success: true, message: 'Referral tracked successfully!' });
  } catch (error) {
    console.error('Error tracking referral:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pay commission (admin endpoint)
router.post('/pay-commission', async (req, res) => {
  try {
    const { businessId, amount } = req.body;
    if (!businessId || !amount) return res.status(400).json({ success: false, error: 'Business ID and amount required' });

    const commissionAmount = amount * 0.05;
    const referralResult = await query(`SELECT r.*, p.id as promoter_id FROM referrals r JOIN promoters p ON r.promoter_id = p.id WHERE r.business_id = $1 AND r.status = 'pending'`, [businessId]);
    if (referralResult.rows.length === 0) return res.json({ success: false, error: 'No pending referral found' });
    const referral = referralResult.rows[0];
    await query(`UPDATE referrals SET status = 'paid', commission_amount = $1, paid_at = NOW() WHERE id = $2`, [commissionAmount, referral.id]);
    await query(`UPDATE promoters SET total_earnings = total_earnings + $1 WHERE id = $2`, [commissionAmount, referral.promoter_id]);

    res.json({ success: true, message: 'Commission paid!', commissionAmount, promoterId: referral.promoter_id });
  } catch (error) {
    console.error('Error paying commission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
