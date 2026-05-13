import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

function iso(d) { return d.toISOString(); }

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
}

function startOfWeekUTC(date) {
  // Monday 00:00 UTC
  const d = startOfDayUTC(date);
  const day = d.getUTCDay(); // 0=Sun
  const diffToMon = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMon);
  return d;
}

async function countActions(userId, actions, fromISO, toISO) {
  const out = {};
  await Promise.all(actions.map(async (a) => {
    const { count } = await supabase
      .from('lp_xp_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', a)
      .gte('created_at', fromISO)
      .lt('created_at', toISO);
    out[a] = count || 0;
  }));
  return out;
}

async function activeDays(userId, fromISO, toISO) {
  // Uses any xp_log action as "active" (distinct UTC dates)
  const { data } = await supabase
    .from('lp_xp_log')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', fromISO)
    .lt('created_at', toISO)
    .order('created_at', { ascending: false })
    .limit(2000);
  const set = new Set();
  for (const r of data || []) {
    const day = String(r.created_at).slice(0, 10);
    set.add(day);
  }
  return set.size;
}

function delta(cur, prev) {
  return { current: cur, prev, delta: cur - prev };
}

function computeNextBestAction({ curCounts, st, isOrg }) {
  const xpHints = {
    comment: 10,
    bookmark: 5,
    community_post: 20,
    post_opportunity: 50,
    daily_login: 10,
  };

  // Prefer weak-spot improvements; keep orgs away from goals/cv
  if ((curCounts.comment || 0) === 0) {
    return { title: 'Fastest XP: 1 comment', why: 'Comments give XP and boost your visibility.', cta: 'Go comment in Community', route: '/community', xp: xpHints.comment };
  }
  if ((curCounts.bookmark || 0) === 0) {
    return { title: 'Quick win: save 1 opportunity', why: 'Saving helps you track deadlines and earns XP.', cta: 'Browse opportunities', route: '/feed', xp: xpHints.bookmark };
  }
  if (!isOrg && (st?.current_streak || 0) < 3) {
    return { title: 'Build your streak', why: 'A daily streak levels you up faster over time.', cta: 'Open Leaderboard', route: '/leaderboard', xp: xpHints.daily_login };
  }
  if ((curCounts.community_post || 0) === 0) {
    return { title: 'Stand out: make 1 community post', why: 'Sharing tips earns XP and attracts opportunities.', cta: 'Post in Community', route: '/community', xp: xpHints.community_post };
  }
  if (isOrg && (curCounts.post_opportunity || 0) === 0) {
    return { title: 'Publish an opportunity', why: 'Posting attracts candidates and increases engagement.', cta: 'Post an opportunity', route: '/post', xp: xpHints.post_opportunity };
  }
  return { title: 'Keep going', why: 'You’re consistent — focus on one meaningful action today.', cta: 'Open AI for next steps', route: '/ai', xp: 0 };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const now = new Date();
    const thisWeekStart = startOfWeekUTC(now);
    const nextWeekStart = new Date(thisWeekStart); nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);

    const actions = ['comment', 'bookmark', 'community_post', 'post_opportunity', 'daily_login'];

    const [{ data: st }, { data: profile }, curCounts, prevCounts, curDays, prevDays] = await Promise.all([
      supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('lp_user_profile').select('account_type').eq('user_id', userId).maybeSingle(),
      countActions(userId, actions, iso(thisWeekStart), iso(nextWeekStart)),
      countActions(userId, actions, iso(lastWeekStart), iso(thisWeekStart)),
      activeDays(userId, iso(thisWeekStart), iso(nextWeekStart)),
      activeDays(userId, iso(lastWeekStart), iso(thisWeekStart)),
    ]);

    const isOrg = (profile?.account_type || 'person') === 'organization';
    const nextBest = computeNextBestAction({ curCounts, st, isOrg });

    return res.status(200).json({
      range: {
        thisWeekStart: iso(thisWeekStart),
        lastWeekStart: iso(lastWeekStart),
      },
      deltas: {
        comments:   delta(curCounts.comment || 0, prevCounts.comment || 0),
        bookmarks:  delta(curCounts.bookmark || 0, prevCounts.bookmark || 0),
        posts:      delta(curCounts.community_post || 0, prevCounts.community_post || 0),
        logins:     delta(curCounts.daily_login || 0, prevCounts.daily_login || 0),
        activeDays: delta(curDays, prevDays),
      },
      nextBestAction: nextBest,
      streak: {
        current: st?.current_streak || 0,
        longest: st?.longest_streak || 0,
        level: st?.level || 1,
        total_xp: st?.total_xp || 0,
      },
    });
  } catch (err) {
    console.error('Insights error:', err);
    return res.status(500).json({ error: err.message });
  }
}

