/**
 * Aggressive Push Notification System
 * Maximizes user engagement through strategic notification delivery
 * 
 * Notification Types:
 * 1. Perfect Match (100%) - Immediate
 * 2. New Opportunity Matched - Real-time
 * 3. Deadline Approaching - 7d, 3d, 1d, 6h
 * 4. Application Checklist Reminder - Daily if incomplete
 * 5. Community Activity - Likes, comments
 * 6. Achievement Unlocked - Instant
 * 7. Weekly Digest - Sunday evening
 * 8. Streak Reminder - Daily at 9 PM if not visited
 * 9. Personalized Tips - 2x per week
 * 10. Featured Opportunities - Daily
 */

import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Web Push implementation (simplified - would use web-push library in production)
async function sendPushNotification(subscription, payload) {
  // In production, use the web-push library:
  // const webpush = require('web-push');
  // webpush.setVapidDetails('mailto:contact@launchpadcm.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  // await webpush.sendNotification(subscription, JSON.stringify(payload));
  
  console.log('[Push] Would send notification:', payload);
  return true;
}

// Store notification in database
async function createNotification(userId, type, title, body, refId = null) {
  const { error } = await supabase.from('lp_notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    ref_id: refId,
    read: false
  });
  
  if (error) {
    console.error('[Notifications] DB insert error:', error);
  }
}

// Get user's push subscription
async function getUserPushSubscription(userId) {
  const { data } = await supabase
    .from('lp_user_push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .single();
  
  return data;
}

// Check if user has notifications enabled
async function hasNotificationsEnabled(userId, notificationType) {
  const { data: prefs } = await supabase
    .from('lp_user_preferences')
    .select('push_notifications')
    .eq('user_id', userId)
    .single();
  
  if (!prefs) return true; // Default enabled
  
  const pushPrefs = prefs.push_notifications || {};
  return pushPrefs[notificationType] !== false;
}

/**
 * 1. PERFECT MATCH (100%) NOTIFICATION
 * Triggered when a new opportunity is a perfect match
 */
export async function notifyPerfectMatch(userId, opportunity) {
  if (!await hasNotificationsEnabled(userId, 'new_opportunities')) return;
  
  const title = '🎯 Perfect Match Found!';
  const body = `${opportunity.title} is a 100% match for your profile. Apply now!`;
  
  await createNotification(userId, 'perfect_match', title, body, opportunity.id);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/trophy.png',
      badge: '/icons/badge.png',
      tag: 'perfect-match',
      requireInteraction: true,
      data: {
        url: `/opportunities/${opportunity.id}/apply`,
        opportunityId: opportunity.id
      }
    });
  }
}

/**
 * 2. NEW OPPORTUNITY MATCHED
 * Triggered when a new high-match opportunity is found
 */
export async function notifyNewMatch(userId, opportunity, matchScore) {
  if (!await hasNotificationsEnabled(userId, 'new_opportunities')) return;
  
  const emoji = matchScore >= 90 ? '🔥' : matchScore >= 80 ? '⭐' : '✨';
  const title = `${emoji} New ${matchScore}% Match`;
  const body = `${opportunity.title} matches your interests!`;
  
  await createNotification(userId, 'new_match', title, body, opportunity.id);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/opportunity.png',
      data: {
        url: `/opportunities/${opportunity.id}/apply`,
        matchScore
      }
    });
  }
}

/**
 * 3. DEADLINE APPROACHING NOTIFICATIONS
 * Multi-stage reminders at 7d, 3d, 1d, 6h
 */
export async function notifyDeadlineApproaching(userId, opportunity, hoursRemaining) {
  if (!await hasNotificationsEnabled(userId, 'deadline_reminders')) return;
  
  let title, body, urgency;
  
  if (hoursRemaining <= 6) {
    title = '🚨 URGENT: Deadline in 6 Hours!';
    body = `Last chance to apply for ${opportunity.title}`;
    urgency = 'critical';
  } else if (hoursRemaining <= 24) {
    title = '⏰ Deadline Tomorrow!';
    body = `${opportunity.title} deadline is tomorrow`;
    urgency = 'high';
  } else if (hoursRemaining <= 72) {
    title = '📅 3 Days Left';
    body = `Don't miss ${opportunity.title}`;
    urgency = 'medium';
  } else {
    title = '📌 1 Week Reminder';
    body = `${opportunity.title} deadline approaching`;
    urgency = 'low';
  }
  
  await createNotification(userId, 'deadline_reminder', title, body, opportunity.id);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/clock.png',
      badge: '/icons/badge.png',
      tag: `deadline-${opportunity.id}`,
      requireInteraction: hoursRemaining <= 24,
      data: {
        url: `/opportunities/${opportunity.id}/apply`,
        urgency
      }
    });
  }
}

/**
 * 4. APPLICATION CHECKLIST REMINDER
 * Daily reminder if application is incomplete
 */
export async function notifyChecklistIncomplete(userId, opportunity, progressPercent) {
  if (!await hasNotificationsEnabled(userId, 'application_updates')) return;
  
  const title = '📋 Complete Your Application';
  const body = `${opportunity.title} is ${progressPercent}% complete. Keep going!`;
  
  await createNotification(userId, 'checklist_reminder', title, body, opportunity.id);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/checklist.png',
      data: {
        url: `/opportunities/${opportunity.id}/apply`,
        progress: progressPercent
      }
    });
  }
}

/**
 * 5. COMMUNITY ACTIVITY NOTIFICATIONS
 * Likes, comments on user's posts/opportunities
 */
export async function notifyCommunityActivity(userId, activityType, actorName, itemTitle) {
  if (!await hasNotificationsEnabled(userId, 'community_activity')) return;
  
  let title, body, emoji;
  
  switch (activityType) {
    case 'like':
      emoji = '❤️';
      title = 'Someone liked your post';
      body = `${actorName} liked "${itemTitle}"`;
      break;
    case 'comment':
      emoji = '💬';
      title = 'New comment on your post';
      body = `${actorName} commented on "${itemTitle}"`;
      break;
    case 'mention':
      emoji = '👋';
      title = 'You were mentioned';
      body = `${actorName} mentioned you`;
      break;
    default:
      return;
  }
  
  await createNotification(userId, activityType, title, body);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title: `${emoji} ${title}`,
      body,
      icon: '/icons/community.png',
      data: { url: '/community' }
    });
  }
}

/**
 * 6. ACHIEVEMENT UNLOCKED
 * Instant notification for badges/milestones
 */
export async function notifyAchievement(userId, badgeKey, badgeLabel, xpAwarded) {
  if (!await hasNotificationsEnabled(userId, 'achievements')) return;
  
  const title = '🏆 Achievement Unlocked!';
  const body = `${badgeLabel} • +${xpAwarded} XP`;
  
  await createNotification(userId, 'achievement', title, body);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/trophy.png',
      badge: '/icons/badge.png',
      tag: 'achievement',
      vibrate: [200, 100, 200],
      data: { url: '/profile' }
    });
  }
}

/**
 * 7. WEEKLY DIGEST
 * Sunday evening summary of opportunities
 */
export async function notifyWeeklyDigest(userId, stats) {
  if (!await hasNotificationsEnabled(userId, 'weekly_digest')) return;
  
  const title = '📊 Your Weekly Summary';
  const body = `${stats.newOpportunities} new matches • ${stats.applications} applications in progress`;
  
  await createNotification(userId, 'weekly_digest', title, body);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/digest.png',
      data: { url: '/feed' }
    });
  }
}

/**
 * 8. STREAK REMINDER
 * Daily at 9 PM if user hasn't visited today
 */
export async function notifyStreakReminder(userId, currentStreak) {
  const title = currentStreak > 0 ? '🔥 Keep Your Streak!' : '👋 We Miss You!';
  const body = currentStreak > 0 
    ? `Don't break your ${currentStreak}-day streak! Check new opportunities.`
    : 'New opportunities are waiting for you!';
  
  await createNotification(userId, 'streak_reminder', title, body);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/fire.png',
      data: { url: '/feed' }
    });
  }
}

/**
 * 9. PERSONALIZED TIPS
 * 2x per week - Monday & Thursday
 */
export async function notifyPersonalizedTip(userId, tip) {
  const title = '💡 Pro Tip';
  const body = tip.message;
  
  await createNotification(userId, 'tip', title, body);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/lightbulb.png',
      data: { url: tip.url || '/feed' }
    });
  }
}

/**
 * 10. FEATURED OPPORTUNITIES
 * Daily highlight of top opportunity
 */
export async function notifyFeaturedOpportunity(userId, opportunity) {
  if (!await hasNotificationsEnabled(userId, 'new_opportunities')) return;
  
  const title = '⭐ Featured Opportunity';
  const body = `${opportunity.title} • Trending in your field`;
  
  await createNotification(userId, 'featured', title, body, opportunity.id);
  
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await sendPushNotification(subscription.subscription_data, {
      title,
      body,
      icon: '/icons/star.png',
      data: { url: `/opportunities/${opportunity.id}/apply` }
    });
  }
}

/**
 * API HANDLER
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const decoded = jwt.verify(token, JWT_SECRET);

    // Subscribe to push notifications
    if (req.method === 'POST' && req.body.action === 'subscribe') {
      const { subscription } = req.body;
      
      // Store subscription
      const { error } = await supabase.from('lp_user_push_subscriptions').upsert({
        user_id: decoded.userId,
        subscription_data: subscription,
        active: true,
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    }

    // Unsubscribe
    if (req.method === 'DELETE') {
      await supabase
        .from('lp_user_push_subscriptions')
        .update({ active: false })
        .eq('user_id', decoded.userId);
      
      return res.status(200).json({ success: true });
    }

    // Test notification
    if (req.method === 'POST' && req.body.action === 'test') {
      const { type = 'new_match' } = req.body;
      
      switch (type) {
        case 'perfect_match':
          await notifyPerfectMatch(decoded.userId, {
            id: 'test',
            title: 'Test Scholarship Program 2026'
          });
          break;
        case 'deadline':
          await notifyDeadlineApproaching(decoded.userId, {
            id: 'test',
            title: 'Test Internship'
          }, 24);
          break;
        case 'achievement':
          await notifyAchievement(decoded.userId, 'test', 'Test Achievement', 50);
          break;
        default:
          await notifyNewMatch(decoded.userId, {
            id: 'test',
            title: 'Test Opportunity'
          }, 85);
      }
      
      return res.status(200).json({ success: true, message: 'Test notification sent' });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('[Push Notifications] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Helper to add push subscription table to schema
export const PUSH_SUBSCRIPTION_TABLE = `
CREATE TABLE IF NOT EXISTS lp_user_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES lp_users(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subscription_data)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON lp_user_push_subscriptions(user_id) WHERE active = true;
`;
