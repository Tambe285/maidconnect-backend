const { query } = require('../db');

/**
 * 1. LOG A NEW BUSINESS ONBOARDING
 * Call this when a promoter successfully signs up a business.
 */
async function logPromoterOnboarding(promoterId, businessId, businessType, planName, subscriptionPrice) {
  try {
    console.log(`📝 Logging onboarding: Promoter ${promoterId} -> ${businessType} on ${planName}`);
    
    await query(`
      INSERT INTO promoter_onboarding_log 
      (promoter_id, business_id, business_type, plan_subscribed, subscription_revenue)
      VALUES ($1, $2, $3, $4, $5)
    `, [promoterId, businessId, businessType, planName, subscriptionPrice]);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error logging onboarding:', error);
    throw error;
  }
}

/**
 * 2. GET PROMOTER MONTHLY PROGRESS
 * Fetches data for the Promoter Dashboard.
 */
async function getPromoterMonthlyProgress(promoterId) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; 
    const currentYear = now.getFullYear();
    
    // Count how many businesses this promoter onboarded THIS MONTH
    const promoterStats = await query(`
      SELECT COUNT(*) as count
      FROM promoter_onboarding_log
      WHERE promoter_id = $1 AND month = $2 AND year = $3
    `, [promoterId, currentMonth, currentYear]);
    
    // Get TOTAL pool size (5% of ALL subscriptions this month)
    const poolStats = await query(`
      SELECT COALESCE(SUM(subscription_revenue), 0) * 0.05 as pool_size
      FROM promoter_onboarding_log
      WHERE month = $1 AND year = $2
    `, [currentMonth, currentYear]);
    
    return {
      success: true,
      data: {        businessesOnboarded: parseInt(promoterStats.rows[0].count),
        estimatedPool: parseFloat(poolStats.rows[0].pool_size),
        currentMonth: currentMonth,
        currentYear: currentYear
      }
    };
  } catch (error) {
    console.error(' Error getting progress:', error);
    throw error;
  }
}

/**
 * 3. DISTRIBUTE MONTHLY POOL
 * Admin function. Runs once a month to calculate final payouts.
 */
async function distributeMonthlyPool(month, year) {
  try {
    console.log(`🔄 Distributing pool for ${month}/${year}...`);
    
    // Run the SQL function we created in Step 1
    const results = await query(`
      SELECT * FROM calculate_promoter_pool_distribution($1, $2)
    `, [month, year]);
    
    // Save results to the database table
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
          updated_at = NOW()
      `, [
        row.promoter_id, month, year, 
        row.businesses_onboarded, row.share_percentage, 
        row.payout_amount, row.total_pool
      ]);
    }
    
    console.log(`✅ Distributed pool among ${results.rows.length} promoters.`);
    return { success: true, details: results.rows };
    
  } catch (error) {
    console.error('❌ Error distributing pool:', error);
    throw error;  }
}

module.exports = {
  logPromoterOnboarding,
  getPromoterMonthlyProgress,
  distributeMonthlyPool
};
