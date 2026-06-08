/**
 * Cron Job: Perfect Match Detection & Notification
 * Runs every hour to check for 100% matches and send immediate notifications
 * 
 * Also handles:
 * - Deadline approaching notifications
 * - Incomplete checklist reminders
 * - Streak reminders (9 PM daily)
 */

import supabase from './_supabase.js';
import {
  notifyPerfectMatch,
  notifyNewMatch,
  notifyDeadlineApproaching,
  notifyChecklistIncomplete,
  notifyStreakReminder,
  notifyFeaturedOpportunity,
  notifyPersonalizedTip
} from './push-notifications.js';

// Calculate user age
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Check eligibility
function meetsEligibility(user, opportunity) {
  const eligibility = opportunity.eligibility || {};
  
  if (eligibility.age_min || eligibility.age_max) {
    const userAge = calculateAge(user.date_of_birth) || user.age;
    if (!userAge) return false;
    if (eligibility.age_min && userAge < eligibility.age_min) return false;
    if (eligibility.age_max && userAge > eligibility.age_max) return false;
  }
  
  if (eligibility.nationalities && eligibility.nationalities.length > 0) {
    if (!user.nationality) return false;
    if (!eligibility.nationalities.includes(user.nationality)) return false;
  }
  
  if (eligibility.degrees && eligibility.degrees.length > 0) {
    if (!user.degree_level) return false;
    if (!eligibility.degrees.includes(user.degree_level.toLowerCase())) return false;
  }
  
  return true;
}

// Calculate match score
function calculateMatchScore(user, opportunity) {
  let score = 0;
  
  score += 20; // Base eligibility
  
  const userInterests = JSON.parse(user.interests || '[]');
  const oppKeywords = opportunity.keywords || [];
  const interestMatches = userInterests.filter(interest =>
    oppKeywords.some(keyword => keyword.toLowerCase().includes(interest.toLowerCase()))
  );
  score += Math.min(interestMatches.length * 10, 30);
  
  if (user.academic_discipline && opportunity.primary_field) {
    if (user.academic_discipline.toLowerCase() === opportunity.primary_field.toLowerCase()) {
      score += 25;
    }
  }
  
  if (opportunity.is_remote) {
    score += 10;
  } else if (user.location && opportunity.location) {
    if (opportunity.location.toLowerCase().includes(user.location.toLowerCase())) {
      score += 15;
    }
  }
  
  if (opportunity.is_fully_funded) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

// Main matching logic
async function checkPerfectMatches() {
  console.log('[Cron] Starting perfect match detection...');
  
  try {
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('lp_users')
      .select('*');
    
    if (usersError) throw usersError;
    
    // Get new opportunities (created in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: opportunities, error: oppsError } = await supabase
      .from('lp_opportunities_v2')
      .select('*')
      .gte('created_at', oneHourAgo)
      .eq('is_verified', true);
    
    if (oppsError) throw oppsError;
    
    if (!opportunities || opportunities.length === 0) {
      console.log('[Cron] No new opportunities to check');
      return;
    }
    
    let perfectMatches = 0;
    let highMatches = 0;
    
    for (const user of users) {
      for (const opp of opportunities) {
        // Check if already notified
        const { data: existing } = await supabase
          .from('lp_notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('ref_id', opp.id)
          .eq('type', 'perfect_match')
          .single();
        
        if (existing) continue; // Already notified
        
        // Check eligibility and calculate score
        if (!meetsEligibility(user, opp)) continue;
        
        const score = calculateMatchScore(user, opp);
        
        if (score === 100) {
          // Perfect match! Send immediate notification
          await notifyPerfectMatch(user.id, opp);
          perfectMatches++;
          console.log(`[Cron] Perfect match: ${user.email} <-> ${opp.title}`);
        } else if (score >= 85) {
          // High match - also notify
          await notifyNewMatch(user.id, opp, score);
          highMatches++;
        }
      }
    }
    
    console.log(`[Cron] Sent ${perfectMatches} perfect match + ${highMatches} high match notifications`);
  } catch (error) {
    console.error('[Cron] Perfect match detection error:', error);
  }
}

// Check deadline reminders
async function checkDeadlineReminders() {
  console.log('[Cron] Checking deadline reminders...');
  
  try {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get bookmarked opportunities with upcoming deadlines
    const { data: bookmarks, error } = await supabase
      .from('lp_bookmarks_v2')
      .select('*, lp_users(*)')
      .eq('applied', false)
      .not('deadline', 'is', null);
    
    if (error) throw error;
    
    for (const bookmark of bookmarks || []) {
      try {
        const deadline = new Date(bookmark.deadline);
        const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
        
        // Send notifications at specific intervals
        if (Math.abs(hoursRemaining - 168) < 1) { // 7 days
          await notifyDeadlineApproaching(bookmark.user_id, bookmark, 168);
        } else if (Math.abs(hoursRemaining - 72) < 1) { // 3 days
          await notifyDeadlineApproaching(bookmark.user_id, bookmark, 72);
        } else if (Math.abs(hoursRemaining - 24) < 1) { // 1 day
          await notifyDeadlineApproaching(bookmark.user_id, bookmark, 24);
        } else if (Math.abs(hoursRemaining - 6) < 1) { // 6 hours
          await notifyDeadlineApproaching(bookmark.user_id, bookmark, 6);
        }
      } catch (e) {
        console.error('[Cron] Deadline reminder error:', e);
      }
    }
  } catch (error) {
    console.error('[Cron] Deadline check error:', error);
  }
}

// Check incomplete applications
async function checkIncompleteApplications() {
  console.log('[Cron] Checking incomplete applications...');
  
  try {
    const { data: applications, error } = await supabase
      .from('lp_applications')
      .select('*')
      .eq('status', 'draft');
    
    if (error) throw error;
    
    for (const app of applications || []) {
      const checklist = app.checklist || [];
      if (checklist.length === 0) continue;
      
      const completed = checklist.filter((item) => item.done).length;
      const progress = Math.round((completed / checklist.length) * 100);
      
      if (progress > 0 && progress < 100) {
        await notifyChecklistIncomplete(app.user_id, app.opportunity, progress);
      }
    }
  } catch (error) {
    console.error('[Cron] Incomplete application check error:', error);
  }
}

// Check streaks (runs at 9 PM daily)
async function checkStreaks() {
  const hour = new Date().getHours();
  if (hour !== 21) return; // Only run at 9 PM
  
  console.log('[Cron] Checking streaks...');
  
  try {
    const today = new Date().toDateString();
    
    const { data: streaks, error } = await supabase
      .from('lp_streaks')
      .select('*');
    
    if (error) throw error;
    
    for (const streak of streaks || []) {
      const lastSeen = streak.last_seen ? new Date(streak.last_seen).toDateString() : null;
      
      // User hasn't visited today
      if (lastSeen !== today) {
        await notifyStreakReminder(streak.user_id, streak.current_streak);
      }
    }
  } catch (error) {
    console.error('[Cron] Streak check error:', error);
  }
}

// Send personalized tips (Monday & Thursday at 10 AM)
async function sendPersonalizedTips() {
  const day = new Date().getDay();
  const hour = new Date().getHours();
  
  if ((day !== 1 && day !== 4) || hour !== 10) return; // Monday=1, Thursday=4
  
  console.log('[Cron] Sending personalized tips...');
  
  const tips = [
    { message: 'Tailor your CV to each opportunity. Highlight relevant experience and skills.', url: '/profile' },
    { message: 'Start applications early. Last-minute submissions often miss important details.', url: '/feed' },
    { message: 'Follow up after submitting. A polite email can make you stand out.', url: '/community' },
    { message: 'Join study circles to connect with others applying to similar opportunities.', url: '/circles' },
    { message: 'Complete your profile to unlock better opportunity matches.', url: '/profile' }
  ];
  
  try {
    const { data: users, error } = await supabase.from('lp_users').select('id');
    if (error) throw error;
    
    for (const user of users || []) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      await notifyPersonalizedTip(user.id, randomTip);
    }
  } catch (error) {
    console.error('[Cron] Tips error:', error);
  }
}

// Send featured opportunity (daily at 8 AM)
async function sendFeaturedOpportunity() {
  const hour = new Date().getHours();
  if (hour !== 8) return;
  
  console.log('[Cron] Sending featured opportunity...');
  
  try {
    // Get highest-rated opportunity
    const { data: featured, error } = await supabase
      .from('lp_opportunities_v2')
      .select('*')
      .eq('is_verified', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !featured) return;
    
    const { data: users } = await supabase.from('lp_users').select('id');
    
    for (const user of users || []) {
      await notifyFeaturedOpportunity(user.id, featured);
    }
  } catch (error) {
    console.error('[Cron] Featured opportunity error:', error);
  }
}

/**
 * MAIN CRON HANDLER
 */
export default async function handler(req, res) {
  // Verify cron secret
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Cron] Match & Notify job started');
  
  try {
    // Run all checks
    await Promise.all([
      checkPerfectMatches(),
      checkDeadlineReminders(),
      checkIncompleteApplications(),
      checkStreaks(),
      sendPersonalizedTips(),
      sendFeaturedOpportunity()
    ]);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Match & notify cron completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
