const { query } = require('../db');

/**
 * Calculate and distribute promoter pool for a given month
 * Run this on the 5th of every month for the previous month
 */
async function distributePromoterPool(month, year) {
  try {
    console.log(`🔄 Calculating promoter pool for ${month}/${year}`);
    
    // 1. Get all promoter performance data using our SQL function
    const results = await query(`
      SELECT * FROM calculate_promoter_pool_distribution($1, $2)
    `, [month, year]);
    
    const totalPool = results.rows[0]?.total_pool || 0;
    
    // 2. Insert or update each promoter's monthly record
    for (const row of results.rows) {
      await query(`
        INSERT INTO promoter_monthly_performance 
        (promoter_id, month, year, businesses_onboarded, share_percentage, payout_amount, total_pool_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (promoter_id, month, year)
        DO UPDATE SET
          businesses_onboarded = EXCLUDED.businesses_onboarded,
          share_percentage = EXCLUDED.share_percentage,
          payout_amount = EXCLUDED.payout_amount,
          total_pool_amount = EXCLUDED.total_pool_amount,
          updated_at = NOW()
      `, [
        row.promoter_id,
        month,
        year,
        row.businesses_onboarded,
        row.share_percentage,
        row.payout_amount,
        row.total_pool
      ]);
    }
    
    console.log(`✅ Pool distributed: ₹${totalPool} among ${results.rows.length} promoters`);
    
    return {
      success: true,
      totalPool,
      totalPromoters: results.rows.length,
      details: results.rows
    };
      } catch (error) {
    console.error('❌ Error distributing promoter pool:', error);
    throw error;
  }
}

/**
 * Log a successful business onboarding by a promoter
 * Call this when a business completes subscription signup
 */
async function logPromoterOnboarding(promoterId, businessId, businessType, plan, revenue) {
  try {
    await query(`
      INSERT INTO promoter_onboarding_log 
      (promoter_id, business_id, business_type, plan_subscribed, subscription_revenue)
      VALUES ($1, $2, $3, $4, $5)
    `, [promoterId, businessId, businessType, plan, revenue]);
    
    console.log(`📝 Logged onboarding: Promoter #${promoterId} → ${businessType} on ${plan}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error logging onboarding:', error);
    throw error;
  }
}

/**
 * Get promoter's current month progress (real-time dashboard)
 */
async function getPromoterMonthlyProgress(promoterId) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    const currentYear = now.getFullYear();
    
    const progress = await query(`
      SELECT 
        COUNT(*) as businesses_onboarded,
        COALESCE(SUM(subscription_revenue), 0) as total_revenue_generated
      FROM promoter_onboarding_log
      WHERE promoter_id = $1 AND month = $2 AND year = $3
    `, [promoterId, currentMonth, currentYear]);
    
    // Get total pool estimate (5% of total revenue this month)
    const poolEstimate = await query(`
      SELECT COALESCE(SUM(subscription_revenue), 0) * 0.05 as estimated_pool
      FROM promoter_onboarding_log
      WHERE month = $1 AND year = $2
    `, [currentMonth, currentYear]);
        return {
      success: true,
      currentMonth,
      currentYear,
      businessesOnboarded: parseInt(progress.rows[0].businesses_onboarded),
      revenueGenerated: parseFloat(progress.rows[0].total_revenue_generated),
      estimatedPool: parseFloat(poolEstimate.rows[0].estimated_pool),
      message: `You've onboarded ${progress.rows[0].businesses_onboarded} businesses this month!`
    };
  } catch (error) {
    console.error('❌ Error getting promoter progress:', error);
    throw error;
  }
}

module.exports = {
  distributePromoterPool,
  logPromoterOnboarding,
  getPromoterMonthlyProgress
};
