/**
 * Netlify Scheduled Function
 * Wraps the cron job for Netlify's scheduled functions feature
 * 
 * Schedule: Runs every hour
 * Purpose: Check for perfect matches and send notifications
 */

import handler from '../../api/cron-match-notify.js';

// Export the handler
export { handler };

// Define the schedule using Netlify's syntax
// Runs every hour at minute 0
export const schedule = '0 * * * *';

// Alternative: Run every 30 minutes
// export const schedule = '*/30 * * * *';

// Alternative: Run every 15 minutes
// export const schedule = '*/15 * * * *';
