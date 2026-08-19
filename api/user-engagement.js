import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Helper
function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

// ── BADGE DEFINITIONS ────────────────────────────────────────────────────

const BADGES = {
  first_apply: {
    name: 'First Step',
    description: 'You\'ve started your first application. Great momentum!',
    icon: '🚀',
    requirement: { type: 'applications', count: 1 },
  },
  five_applies: {
    name: 'Active Applicant',
    description: 'You\'ve started 5 applications. You\'re serious about opportunities!',
    icon: '💪',
    requirement: { type: 'applications', count: 5 },
  },
  ten_applies: {
    name: 'Go-Getter',
    description: 'You\'ve started 10 applications. You\'re unstoppable!',
    icon: '⚡',
    requirement: { type: 'applications', count: 10 },
  },
  submitted_app: {
    name: 'Submitted',
    description: 'You\'ve submitted an application. Fingers crossed!',
    icon: '✨',
    requirement: { type: 'submitted_applications', count: 1 },
  },
  five_submissions: {
    name: 'Persistent',
    description: 'You\'ve submitted 5 applications. Determination pays off!',
    icon: '🏆',
    requirement: { type: 'submitted_applications', count: 5 },
  },
  first_connection: {
    name: 'Networker',
    description: 'You\'ve made your first connection. Community is key!',
    icon: '🤝',
    requirement: { type: 'connections', count: 1 },
  },
  five_connections: {
    name: 'Connector',
    description: 'You\'ve made 5 connections. You\'re building a network!',
    icon: '🌐',
    requirement: { type: 'connections', count: 5 },
  },
  ten_connections: {
    name: 'Community Leader',
    description: 'You\'ve made 10 connections. You\'re a pillar of the community!',
    icon: '👑',
    requirement: { type: 'connections', count: 10 },
  },
  first_post: {
    name: 'Voice of LaunchPad',
    description: 'You\'ve posted your first opportunity. Help others discover!',
    icon: '📢',
    requirement: { type: 'opportunities_posted', count: 1 },
  },
  first_blip: {
    name: 'Content Creator',
    description: 'You\'ve created your first Blip. Video is powerful!',
    icon: '🎬',
    requirement: { type: 'blips_created', count: 1 },
  },
  verified_contributor: {
    name: 'Verified Contributor',
    description: 'Your posts are verified and trusted by the community!',
    icon: '✓',
    requirement: { type: 'verified_posts', count: 1 },
  },
};

// ── ENGAGEMENT HELPERS ───────────────────────────────────────────────────

async function trackEngagement(userId, action, metadata = {}) {
  try {
    await supabase.from('lp_engagement_log').insert({
      user_id: userId,
      event_type: action,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Track engagement error:', e.message);
  }
}

async function checkAndAwardBadges(userId) {
  try {
    const { data: user } = await supabase
      .from('lp_users')
      .select('badges, id, full_name, email')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const userBadges = user.badges || [];
    const newBadges = [];

    // Get user stats
    const { count: appCount } = await supabase
      .from('lp_applications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    const { count: submittedCount } = await supabase
      .from('lp_applications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'submitted');

    const { count: connCount } = await supabase
      .from('lp_connections')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { count: oppCount } = await supabase
      .from('lp_verified_opps')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    const { count: blipCount } = await supabase
      .from('lp_blips')
      .select('*', { count: 'exact' })
      .eq('creator_id', userId);

    // Check each badge
    for (const [badgeKey, badge] of Object.entries(BADGES)) {
      if (userBadges.includes(badgeKey)) continue; // Already earned

      let shouldAward = false;

      if (badge.requirement.type === 'applications' && appCount >= badge.requirement.count) {
        shouldAward = true;
      } else if (badge.requirement.type === 'submitted_applications' && submittedCount >= badge.requirement.count) {
        shouldAward = true;
      } else if (badge.requirement.type === 'connections' && connCount >= badge.requirement.count) {
        shouldAward = true;
      } else if (badge.requirement.type === 'opportunities_posted' && oppCount >= badge.requirement.count) {
        shouldAward = true;
      } else if (badge.requirement.type === 'blips_created' && blipCount >= badge.requirement.count) {
        shouldAward = true;
      }

      if (shouldAward) {
        newBadges.push(badgeKey);
        
        // Update user badges
        const updatedBadges = [...userBadges, badgeKey];
        await supabase.from('lp_users').update({ badges: updatedBadges }).eq('id', userId);

        // Send notification
        await fetch('https://api.launchpadcm.com/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'trigger',
            trigger_type: 'badge_unlocked',
            user_id: userId,
            data: {
              badge_name: badge.name,
              badge_description: badge.description,
            },
          }),
        }).catch(e => console.error('Badge notification error:', e.message));

        // Log achievement
        await supabase.from('lp_engagement_log').insert({
          user_id: userId,
          event_type: 'badge_earned',
          metadata: { badge: badgeKey, name: badge.name },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return newBadges;
  } catch (e) {
    console.error('Check badges error:', e.message);
    return [];
  }
}

// ── API HANDLER ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── GET: Get user engagement stats ───────────────────────────────
    if (req.method === 'GET') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { count: applications } = await supabase
        .from('lp_applications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      const { count: submitted } = await supabase
        .from('lp_applications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'submitted');

      const { count: connections } = await supabase
        .from('lp_connections')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      const { data: user } = await supabase
        .from('lp_users')
        .select('badges, total_xp')
        .eq('id', userId)
        .single();

      return res.status(200).json({
        applications: applications || 0,
        submitted: submitted || 0,
        connections: connections || 0,
        badges: user?.badges || [],
        total_xp: user?.total_xp || 0,
      });
    }

    // ── POST: Track engagement action ────────────────────────────────
    if (req.method === 'POST') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { action, metadata } = req.body;
      if (!action) return res.status(400).json({ error: 'Action required' });

      // Track the engagement
      await trackEngagement(userId, action, metadata);

      // Check for new badges
      const newBadges = await checkAndAwardBadges(userId);

      return res.status(200).json({
        ok: true,
        new_badges: newBadges,
      });
    }

    // ── PUT: Update notification preferences ─────────────────────────
    if (req.method === 'PUT') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { notification_preferences } = req.body;
      if (!notification_preferences) return res.status(400).json({ error: 'Preferences required' });

      await supabase
        .from('lp_users')
        .update({ notification_preferences })
        .eq('id', userId);

      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('User engagement error:', err);
    res.status(500).json({ error: err.message });
  }
}

export { checkAndAwardBadges };
