import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { sendOneSignalNotification } from './_onesignal.js';

const JWT_SECRET = process.env.JWT_SECRET;
const CLAIM_RATELIMIT_MS = 2500;

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try {
    return jwt.verify(t, JWT_SECRET).userId;
  } catch {
    return null;
  }
}

function dayStartUtcISO(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)).toISOString();
}

function weekStartUtcISO(d = new Date()) {
  // Monday 00:00 UTC
  const day = d.getUTCDay(); // 0=Sun
  const diffToMon = (day + 6) % 7;
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  mon.setUTCDate(mon.getUTCDate() - diffToMon);
  return mon.toISOString();
}

const DAILY_CAPS = { comment: 10, bookmark: 10, community_post: 5, post_opportunity: 3 };
const STREAK_QUESTS = [
  { id: 'streak_3', target: 3, rewardXp: 30 },
  { id: 'streak_7', target: 7, rewardXp: 75 },
  { id: 'streak_14', target: 14, rewardXp: 150 },
];

async function countActions(userId, actionKey, sinceISO) {
  const { count } = await supabase
    .from('lp_xp_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', actionKey)
    .gte('created_at', sinceISO);
  const c = count || 0;
  const cap = DAILY_CAPS[actionKey];
  return cap ? Math.min(c, cap) : c;
}

async function hasClaim(userId, questId, sinceISO) {
  const claimKey = `quest_claim:${questId}`;
  const { data } = await supabase
    .from('lp_xp_log')
    .select('id')
    .eq('user_id', userId)
    .eq('action', claimKey)
    .gte('created_at', sinceISO)
    .maybeSingle();
  return !!data;
}

async function hasLifetimeClaim(userId, questId) {
  const claimKey = `quest_claim:${questId}`;
  const { data } = await supabase
    .from('lp_xp_log')
    .select('id')
    .eq('user_id', userId)
    .eq('action', claimKey)
    .maybeSingle();
  return !!data;
}

async function awardXp(userId, xp, action) {
  await supabase.from('lp_xp_log').insert({ user_id: userId, action, xp });
  const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
  if (st) {
    const newXP = (st.total_xp || 0) + xp;
    await supabase
      .from('lp_streaks')
      .update({ total_xp: newXP, level: Math.floor(newXP / 500) + 1, last_seen: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await supabase.from('lp_streaks').insert({
      user_id: userId,
      total_xp: xp,
      level: 1,
      current_streak: 1,
      longest_streak: 1,
      last_seen: new Date().toISOString(),
    });
  }
}

function buildQuests({ isOrg, weak, st }) {
  const dailyPool = isOrg
    ? [
        { id: 'daily_post_opp_1', scope: 'daily', title: 'Post 1 opportunity', description: 'Publish a new opportunity for candidates.', target: 1, actionKey: 'post_opportunity', rewardXp: 60, ctaRoute: '/post' },
        { id: 'daily_comment_1', scope: 'daily', title: 'Leave 1 comment', description: 'Engage with the community to build trust.', target: 1, actionKey: 'comment', rewardXp: 15, ctaRoute: '/community' },
      ]
    : [
        { id: 'daily_comment_2', scope: 'daily', title: 'Make 2 comments', description: 'Join the conversation in posts or blips.', target: 2, actionKey: 'comment', rewardXp: 20, ctaRoute: '/community' },
        { id: 'daily_bookmark_1', scope: 'daily', title: 'Save 1 opportunity', description: 'Bookmark an opportunity you like.', target: 1, actionKey: 'bookmark', rewardXp: 10, ctaRoute: '/feed' },
        { id: 'daily_post_comm_1', scope: 'daily', title: 'Post once in Community', description: 'Share a win, question, or tip.', target: 1, actionKey: 'community_post', rewardXp: 25, ctaRoute: '/community' },
      ];

  const weeklyPool = isOrg
    ? [
        { id: 'weekly_post_opp_2', scope: 'weekly', title: 'Post 2 opportunities', description: 'Keep your org visible with fresh posts.', target: 2, actionKey: 'post_opportunity', rewardXp: 120, ctaRoute: '/post' },
      ]
    : [
        { id: 'weekly_comment_5', scope: 'weekly', title: 'Make 5 comments', description: 'Consistency builds a strong profile.', target: 5, actionKey: 'comment', rewardXp: 60, ctaRoute: '/community' },
        { id: 'weekly_bookmark_5', scope: 'weekly', title: 'Save 5 opportunities', description: 'Create your shortlist for the week.', target: 5, actionKey: 'bookmark', rewardXp: 40, ctaRoute: '/feed' },
      ];

  // Pick 2 daily quests emphasizing weak spots
  const dailySorted = [...dailyPool].sort((a, b) => {
    const aw = weak[a.actionKey] ?? 0;
    const bw = weak[b.actionKey] ?? 0;
    return bw - aw;
  });
  const daily = dailySorted.slice(0, 2);
  const weekly = weeklyPool.slice(0, 1);

  // Add streak escalation quests (lifetime claims)
  const currentStreak = st?.current_streak || 0;
  const streakQuests = STREAK_QUESTS.map((sq) => ({
    id: sq.id,
    scope: 'streak',
    title: `Reach a ${sq.target}-day streak`,
    description: 'Log in daily and stay active to keep your streak.',
    target: sq.target,
    actionKey: 'daily_login',
    rewardXp: sq.rewardXp,
    ctaRoute: '/leaderboard',
    progressMode: 'streak',
    progress: currentStreak,
  }));

  return [...daily, ...weekly, ...streakQuests];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const now = new Date();
    const dailySince = dayStartUtcISO(now);
    const weeklySince = weekStartUtcISO(now);

    if (req.method === 'GET') {
      const [{ data: st }, { data: profile }] = await Promise.all([
        supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('lp_user_profile').select('account_type').eq('user_id', userId).maybeSingle(),
      ]);

      const isOrg = (profile?.account_type || 'person') === 'organization';
      // Weak spots: low counts today -> higher weight
      const todayCounts = {
        comment: await countActions(userId, 'comment', dailySince),
        bookmark: await countActions(userId, 'bookmark', dailySince),
        community_post: await countActions(userId, 'community_post', dailySince),
        post_opportunity: await countActions(userId, 'post_opportunity', dailySince),
      };
      const weak = {
        comment: Math.max(0, 5 - (todayCounts.comment || 0)),
        bookmark: Math.max(0, 3 - (todayCounts.bookmark || 0)),
        community_post: Math.max(0, 2 - (todayCounts.community_post || 0)),
        post_opportunity: Math.max(0, 1 - (todayCounts.post_opportunity || 0)),
      };

      const quests = buildQuests({ isOrg, weak, st });

      const enriched = [];
      for (const q of quests) {
        const sinceISO = q.scope === 'daily' ? dailySince : q.scope === 'weekly' ? weeklySince : null;
        const progress = q.progressMode === 'streak'
          ? (q.progress || 0)
          : await countActions(userId, q.actionKey, sinceISO || dailySince);
        const claimed = q.scope === 'streak'
          ? await hasLifetimeClaim(userId, q.id)
          : await hasClaim(userId, q.id, sinceISO);
        enriched.push({ ...q, progress, completed: progress >= q.target, claimed });
      }
      return res.status(200).json({ quests: enriched, dailySince, weeklySince });
    }

    if (req.method === 'POST') {
      const { questId, claimAll } = req.body || {};

      // Claim rate limit stored in settings
      const { data: extra } = await supabase.from('lp_user_extra').select('settings').eq('user_id', userId).maybeSingle();
      const settings = extra?.settings || {};
      const last = settings?.quest_last_claim_ts ? new Date(settings.quest_last_claim_ts).getTime() : 0;
      if (last && (Date.now() - last) < CLAIM_RATELIMIT_MS) {
        return res.status(429).json({ error: 'Please wait a moment before claiming again.' });
      }

      // Rebuild quests to validate server-side completion
      const [{ data: st }, { data: profile }] = await Promise.all([
        supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('lp_user_profile').select('account_type').eq('user_id', userId).maybeSingle(),
      ]);
      const isOrg = (profile?.account_type || 'person') === 'organization';
      const todayCounts = {
        comment: await countActions(userId, 'comment', dailySince),
        bookmark: await countActions(userId, 'bookmark', dailySince),
        community_post: await countActions(userId, 'community_post', dailySince),
        post_opportunity: await countActions(userId, 'post_opportunity', dailySince),
      };
      const weak = {
        comment: Math.max(0, 5 - (todayCounts.comment || 0)),
        bookmark: Math.max(0, 3 - (todayCounts.bookmark || 0)),
        community_post: Math.max(0, 2 - (todayCounts.community_post || 0)),
        post_opportunity: Math.max(0, 1 - (todayCounts.post_opportunity || 0)),
      };
      const quests = buildQuests({ isOrg, weak, st });

      const claimable = [];
      for (const q of quests) {
        const sinceISO = q.scope === 'daily' ? dailySince : q.scope === 'weekly' ? weeklySince : null;
        const progress = q.progressMode === 'streak'
          ? (st?.current_streak || 0)
          : await countActions(userId, q.actionKey, sinceISO || dailySince);
        const claimed = q.scope === 'streak'
          ? await hasLifetimeClaim(userId, q.id)
          : await hasClaim(userId, q.id, sinceISO);
        const completed = progress >= q.target;
        if (completed && !claimed) claimable.push(q);
      }

      let toClaim = claimable;
      if (!claimAll) {
        const quest = quests.find((q) => q.id === questId);
        if (!quest) return res.status(400).json({ error: 'Unknown quest' });
        toClaim = claimable.filter((q) => q.id === questId);
      }
      if (!toClaim.length) return res.status(400).json({ error: 'No completed quests to claim.' });

      let totalXp = 0;
      for (const q of toClaim) {
        totalXp += q.rewardXp || 0;
        await awardXp(userId, q.rewardXp, `quest_claim:${q.id}`);

        // Push notify (best-effort)
        sendOneSignalNotification({
          headings: 'Quest completed!',
          contents: `You earned +${q.rewardXp} XP: ${q.title}`,
          externalUserIds: [userId],
          userId,
          category: 'quests',
          url: q.ctaRoute ? `${process.env.PUBLIC_APP_URL || ''}${q.ctaRoute}` : undefined,
          data: { questId: q.id },
        }).catch(() => {});
      }

      // Persist claim timestamp for rate limit
      try {
        const newSettings = { ...settings, quest_last_claim_ts: new Date().toISOString() };
        await supabase.from('lp_user_extra').update({ settings: newSettings, updated_at: new Date().toISOString() }).eq('user_id', userId);
      } catch {}

      return res.status(200).json({ ok: true, xp: totalXp, claimed: toClaim.map((q) => q.id) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Quests error:', err);
    return res.status(500).json({ error: err.message });
  }
}

