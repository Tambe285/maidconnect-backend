/**
 * Notification Templates for Worker Profit-Sharing Progress
 * These messages are sent automatically based on worker performance
 */

const notificationTemplates = {
  
  /**
   * Monthly Progress Update
   * Sent on the 1st of every month
   */
  monthlyProgress: (workerName, jobsCompleted, jobsNeeded, avgRating) => {
    const remaining = jobsNeeded - jobsCompleted;
    const progressPercent = Math.round((jobsCompleted / jobsNeeded) * 100);
    
    return {
      title: '📊 Your Monthly Progress Update',
      body: `Hi ${workerName}! You've completed ${jobsCompleted}/${jobsNeeded} jobs (${progressPercent}%). ${remaining > 0 ? `${remaining} more jobs to unlock profit share eligibility!` : '🎉 You\'ve hit the job requirement!'}`,
      type: 'progress',
      priority: 'normal',
      actionRequired: false
    };
  },

  /**
   * Near Eligibility Alert
   * Sent when worker is within 10 jobs of qualifying (40-49 jobs)
   */
  nearEligibility: (workerName, jobsRemaining, avgRating) => {
    return {
      title: '🎯 You\'re Almost There!',
      body: `${workerName}, only ${jobsRemaining} jobs left to qualify for the Annual Profit Share! Keep up the great work (Current rating: ${avgRating}★).`,
      type: 'motivation',
      priority: 'high',
      actionRequired: false
    };
  },

  /**
   * Rating Warning
   * Sent when rating drops below 4.2 (warning zone)
   */
  ratingWarning: (workerName, currentRating) => {
    return {
      title: '⭐ Maintain Your Rating',
      body: `${workerName}, your current rating is ${currentRating}★. Keep it above 4.0★ to stay eligible for profit sharing. Focus on quality service!`,
      type: 'warning',
      priority: 'medium',
      actionRequired: true
    };  },

  /**
   * Eligibility Achieved
   * Sent when worker meets both criteria (50+ jobs AND 4.0+ rating)
   */
  eligibilityAchieved: (workerName, year) => {
    return {
      title: '🎉 Congratulations! You\'re Eligible!',
      body: `${workerName}, you've qualified for the ${year} Annual Profit Share! You're now in the running for a share of 5% of annual profits. Keep maintaining your excellent service!`,
      type: 'success',
      priority: 'high',
      actionRequired: false
    };
  },

  /**
   * Year-End Reminder
   * Sent on December 1st
   */
  yearEndReminder: (workerName, jobsCompleted, daysLeft) => {
    return {
      title: '⏰ Year-End Countdown',
      body: `${workerName}, only ${daysLeft} days left in 2026! You've completed ${jobsCompleted} jobs. Finish strong to maximize your profit share ranking!`,
      type: 'reminder',
      priority: 'high',
      actionRequired: false
    };
  },

  /**
   * Top 100 Notification
   * Sent when worker enters Top 100 rankings
   */
  top100Achieved: (workerName, rank, estimatedBonus) => {
    return {
      title: '🏆 You\'re in the Top 100!',
      body: `${workerName}, amazing work! You're currently ranked #${rank}. Estimated profit share bonus: ₹${estimatedBonus}. Final rankings calculated on Jan 15th.`,
      type: 'achievement',
      priority: 'high',
      actionRequired: false
    };
  },

  /**
   * Payment Processed
   * Sent when profit share is distributed (Jan 15-22)
   */
  paymentProcessed: (workerName, amount, rank, year) => {
    return {      title: '💰 Profit Share Payment Sent!',
      body: `Congratulations ${workerName}! Your ${year} profit share of ₹${amount} (Rank #${rank}) has been transferred to your UPI. Thank you for being an outstanding worker!`,
      type: 'payment',
      priority: 'high',
      actionRequired: false
    };
  },

  /**
   * Not Eligible This Year
   * Sent to workers who didn't qualify (Jan 16th)
   */
  notEligibleThisYear: (workerName, jobsCompleted, avgRating, year) => {
    const missingCriteria = [];
    if (jobsCompleted < 50) missingCriteria.push(`${50 - jobsCompleted} more jobs`);
    if (avgRating < 4.0) missingCriteria.push(`improve rating to 4.0★`);
    
    return {
      title: '📋 Update on Profit Share',
      body: `${workerName}, you didn't qualify for the ${year} profit share. You needed: ${missingCriteria.join(' and ')}. But you still earned 95% of every job! Try again next year.`,
      type: 'info',
      priority: 'normal',
      actionRequired: false
    };
  }
};

/**
 * Helper: Check if worker should receive specific notification
 */
function shouldSendNotification(workerStats, notificationType) {
  const { jobsCompleted, avgRating, rank } = workerStats;
  
  switch(notificationType) {
    case 'nearEligibility':
      return jobsCompleted >= 40 && jobsCompleted < 50;
    
    case 'ratingWarning':
      return avgRating < 4.2 && avgRating >= 4.0;
    
    case 'eligibilityAchieved':
      return jobsCompleted >= 50 && avgRating >= 4.0;
    
    case 'top100':
      return rank && rank <= 100;
    
    case 'notEligible':
      return jobsCompleted < 50 || avgRating < 4.0;
    
    default:      return false;
  }
}

module.exports = {
  notificationTemplates,
  shouldSendNotification
};
