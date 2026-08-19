import supabase from './_supabase.js';
import fetch from 'node-fetch';

// ── ENGAGEMENT SCHEDULING ENGINE ─────────────────────────────────────────

/**
 * Smart engagement scheduler
 * Sends timely notifications based on user behavior and preferences
 */

async function getActiveUsers() {
  const { data } = await supabase
    .from('lp_users')
    .select('id, full_name, email, notification_preferences')
    .eq('is_active', true);
  return data || [];
}

async function getUpcomingDeadlines() {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { data } = await supabase
    .from('lp_opportunities')
    .select('id, title, deadline')
    .gte('deadline', now.toISOString())
    .lte('deadline', futureDate.toISOString())
    .eq('verified', true);

  return data || [];
}

async function getUserBookmarkedOpportunitiesByDeadline(userId) {
  const { data } = await supabase
    .from('lp_bookmarks')
    .select('opportunity_id, lp_opportunities!inner(title, deadline, id)')
    .eq('user_id', userId);

  return data || [];
}

async function getTrendingOpportunities() {
  const { data } = await supabase
    .from('lp_opportunities')
    .select('id, title, category, upvotes')
    .order('upvotes', { ascending: false })
    .limit(5);

  return data || [];
}

async function getNewConnectionSuggestions(userId) {
  // Get users in same interest categories
  const { data } = await supabase
    .from('lp_users')
    .select('id, full_name, interests')
    .neq('id', userId)
    .limit(3);

  return data || [];
}

async function triggerNotification(baseUrl, userId, triggerType, data) {
  try {
    await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trigger',
        trigger_type: triggerType,
        user_id: userId,
        data,
      }),
    });
  } catch (e) {
    console.error('Trigger notification error:', e.message);
  }
}

// ── SCHEDULER JOBS ───────────────────────────────────────────────────────

export async function sendDeadlineReminders(baseUrl = 'https://launchpadcm.netlify.app') {
  console.log('[SCHEDULER] Starting deadline reminder job...');
  
  try {
    const users = await getActiveUsers();
    const upcomingOpps = await getUpcomingDeadlines();

    for (const user of users) {
      const prefs = user.notification_preferences || {};
      if (prefs.deadline_reminders === false) continue;

      for (const opp of upcomingOpps) {
        // Check if user bookmarked this opportunity
        const { data: bookmarked } = await supabase
          .from('lp_bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('link', opp.id)
          .maybeSingle();

        if (bookmarked) {
          await triggerNotification(baseUrl, user.id, 'deadline_reminder', {
            opportunity_id: opp.id,
          });
        }
      }
    }

    console.log('[SCHEDULER] Deadline reminders sent');
  } catch (e) {
    console.error('[SCHEDULER] Deadline reminder job error:', e.message);
  }
}

export async function sendWeeklyTrendingOpportunities(baseUrl = 'https://launchpadcm.netlify.app') {
  console.log('[SCHEDULER] Starting weekly trending job...');

  try {
    const users = await getActiveUsers();
    const trending = await getTrendingOpportunities();

    // Every Thursday at 10 AM (send to users who haven't checked in 3+ days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    for (const user of users) {
      const prefs = user.notification_preferences || {};
      if (prefs.weekly_digest === false) continue;

      const { data: lastActivity } = await supabase
        .from('lp_activity_log')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastActivity || new Date(lastActivity.created_at) < threeDaysAgo) {
        // Send weekly digest
        const push = {
          title: '🔥 This Week\'s Top Opportunities',
          body: `${trending.length} trending opportunities waiting for you`,
          tag: 'weekly_digest',
        };

        await fetch(`${baseUrl}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
          },
          body: JSON.stringify({
            action: 'trigger',
            trigger_type: 'weekly_digest',
            user_id: user.id,
            data: { opportunities: trending },
          }),
        });
      }
    }

    console.log('[SCHEDULER] Weekly digest sent');
  } catch (e) {
    console.error('[SCHEDULER] Weekly digest job error:', e.message);
  }
}

export async function sendInactivityReminders(baseUrl = 'https://launchpadcm.netlify.app') {
  console.log('[SCHEDULER] Starting inactivity reminder job...');

  try {
    const users = await getActiveUsers();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const user of users) {
      const prefs = user.notification_preferences || {};
      if (prefs.inactivity_reminders === false) continue;

      const { data: lastActivity } = await supabase
        .from('lp_activity_log')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastActivity || new Date(lastActivity.created_at) < sevenDaysAgo) {
        // User inactive for 7+ days - send re-engagement push
        await fetch(`${baseUrl}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'trigger',
            trigger_type: 'inactivity_reminder',
            user_id: user.id,
            data: {
              message: 'We miss you! Check out the latest opportunities',
            },
          }),
        });
      }
    }

    console.log('[SCHEDULER] Inactivity reminders sent');
  } catch (e) {
    console.error('[SCHEDULER] Inactivity reminder job error:', e.message);
  }
}

export async function sendConnectionRecommendations(baseUrl = 'https://launchpadcm.netlify.app') {
  console.log('[SCHEDULER] Starting connection recommendation job...');

  try {
    const users = await getActiveUsers();

    for (const user of users) {
      const prefs = user.notification_preferences || {};
      if (prefs.connection_recommendations === false) continue;

      const suggestions = await getNewConnectionSuggestions(user.id);

      if (suggestions.length > 0) {
        await fetch(`${baseUrl}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'trigger',
            trigger_type: 'connection_suggestions',
            user_id: user.id,
            data: {
              suggestions: suggestions.slice(0, 3),
            },
          }),
        });
      }
    }

    console.log('[SCHEDULER] Connection recommendations sent');
  } catch (e) {
    console.error('[SCHEDULER] Connection recommendation job error:', e.message);
  }
}

// ── HANDLER ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Verify internal API key (accept both INTERNAL_API_KEY and CRON_SECRET)
    const authHeader = req.headers.authorization || '';
    const internalKey = process.env.INTERNAL_API_KEY || process.env.CRON_SECRET;
    
    if (!internalKey || !authHeader.includes(internalKey)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { job } = req.body;

    if (job === 'deadline_reminders') {
      await sendDeadlineReminders();
    } else if (job === 'weekly_digest') {
      await sendWeeklyTrendingOpportunities();
    } else if (job === 'inactivity_reminders') {
      await sendInactivityReminders();
    } else if (job === 'connection_recommendations') {
      await sendConnectionRecommendations();
    } else if (job === 'all') {
      await sendDeadlineReminders();
      await sendWeeklyTrendingOpportunities();
      await sendInactivityReminders();
      await sendConnectionRecommendations();
    } else {
      return res.status(400).json({ error: 'Unknown job' });
    }

    return res.status(200).json({ ok: true, job });
  } catch (e) {
    console.error('Engagement scheduler error:', e);
    res.status(500).json({ error: e.message });
  }
}
