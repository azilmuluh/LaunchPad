import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const XP_MAP = {
  daily_login:      10,
  post_opportunity: 50,
  community_post:   20,
  comment:          10,
  bookmark:          5,
  streak_3:         30,
  streak_7:         75,
  streak_30:       200,
};

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── GET — public leaderboard ─────────────────────────────────────────
    if (req.method === 'GET') {
      const { data: streaks, error } = await supabase
        .from('lp_streaks')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = (streaks || []).map(s => s.user_id);
      let userDataMap = {};
      if (userIds.length) {
        const { data: users } = await supabase.from('lp_users').select('id, full_name').in('id', userIds);
        const { data: extras } = await supabase.from('lp_user_extra').select('user_id, avatar_url').in('user_id', userIds);
        
        if (users) users.forEach(u => { 
          userDataMap[u.id] = { name: u.full_name, avatar: null }; 
        });
        if (extras) extras.forEach(e => {
          if (userDataMap[e.user_id]) userDataMap[e.user_id].avatar = e.avatar_url;
        });
      }

      const board = (streaks || []).map((s, i) => {
        const lastDate = new Date(s.last_seen || 0).setHours(0, 0, 0, 0);
        const nowDate  = new Date().setHours(0, 0, 0, 0);
        const diffDays = Math.round((nowDate - lastDate) / 86400000);
        const displayStreak = diffDays > 1 ? 0 : (s.current_streak || 0);

        return {
          rank:             i + 1,
          user_id:          s.user_id,
          name:             userDataMap[s.user_id]?.name || 'Anonymous',
          avatar_url:       userDataMap[s.user_id]?.avatar || null,
          total_xp:         s.total_xp         || 0,
          level:            s.level            || 1,
          current_streak:   displayStreak,
          longest_streak:   s.longest_streak   || 0,
          opps_posted:      s.opps_posted      || 0,
          opps_bookmarked:  s.opps_bookmarked  || 0,
          comments_made:    s.comments_made    || 0,
          posts_made:       s.posts_made       || 0,
        };
      });

      // If logged in, fetch MY badges
      const currentUserId = uid(req);
      let myBadges = [];
      if (currentUserId) {
        const { data: b } = await supabase.from('lp_badges').select('badge_key').eq('user_id', currentUserId);
        myBadges = (b || []).map(x => x.badge_key);
      }

      return res.status(200).json({ board, my_badges: myBadges });
    }

    // ── POST — log XP action ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { action } = req.body;
      const xp = XP_MAP[action];
      if (!xp) return res.status(400).json({ error: 'Unknown action' });

      // Prevent duplicate daily_login XP in same calendar day
      if (action === 'daily_login') {
        const today = new Date().toISOString().slice(0, 10);
        const { data: existing } = await supabase
          .from('lp_xp_log')
          .select('id')
          .eq('user_id', userId)
          .eq('action', 'daily_login')
          .gte('created_at', today + 'T00:00:00Z')
          .maybeSingle();
        if (existing) {
          // Already logged today — just return current stats
          const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
          return res.status(200).json({ xp: 0, total_xp: st?.total_xp || 0, level: st?.level || 1, streak: st?.current_streak || 1, already_logged: true });
        }
      }

      await supabase.from('lp_xp_log').insert({ user_id: userId, action, xp });

      const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
      const now = new Date();

      if (st) {
        // Calculate diff in calendar days
        const lastDate = new Date(st.last_seen || 0).setHours(0, 0, 0, 0);
        const nowDate  = new Date().setHours(0, 0, 0, 0);
        const diffDays = Math.round((nowDate - lastDate) / 86400000);

        let newStreak = st.current_streak || 1;
        if (action === 'daily_login') {
          if (diffDays === 1) {
            newStreak = (st.current_streak || 0) + 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          } else {
            // diffDays === 0 (same day) -> keep existing streak
            newStreak = st.current_streak || 1;
          }
        }
        const newXP    = (st.total_xp || 0) + xp;
        const newLevel = Math.floor(newXP / 500) + 1;
        const updates  = {
          last_seen:       now.toISOString(),
          current_streak:  newStreak,
          longest_streak:  Math.max(st.longest_streak || 0, newStreak),
          total_xp:        newXP,
          level:           newLevel,
        };
        if (action === 'post_opportunity') updates.opps_posted      = (st.opps_posted      || 0) + 1;
        if (action === 'bookmark')         updates.opps_bookmarked  = (st.opps_bookmarked  || 0) + 1;
        if (action === 'comment')          updates.comments_made    = (st.comments_made    || 0) + 1;
        if (action === 'community_post')   updates.posts_made       = (st.posts_made       || 0) + 1;
        await supabase.from('lp_streaks').update(updates).eq('user_id', userId);
        return res.status(200).json({ xp, total_xp: newXP, level: newLevel, streak: newStreak });
      } else {
        await supabase.from('lp_streaks').insert({
          user_id: userId, last_seen: now.toISOString(),
          current_streak: 1, longest_streak: 1, total_xp: xp, level: 1,
          opps_posted:     action === 'post_opportunity' ? 1 : 0,
          opps_bookmarked: action === 'bookmark'         ? 1 : 0,
          comments_made:   action === 'comment'          ? 1 : 0,
          posts_made:      action === 'community_post'   ? 1 : 0,
        });
        return res.status(200).json({ xp, total_xp: xp, level: 1, streak: 1 });
      }
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
}
