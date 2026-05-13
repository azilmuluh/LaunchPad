import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { sendOneSignalNotification } from './_onesignal.js';

const JWT_SECRET = process.env.JWT_SECRET;

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

function dayKeyUTC(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function weekKeyUTC(d = new Date()) {
  // yyyy-Www approx (Monday-based)
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { type } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type required' });

    const { data: extra } = await supabase.from('lp_user_extra').select('settings').eq('user_id', userId).maybeSingle();
    const settings = extra?.settings || {};

    if (type === 'streak_risk') {
      // Only send once per day
      const key = `streak_risk_sent_${dayKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      const { data: st } = await supabase.from('lp_streaks').select('current_streak').eq('user_id', userId).maybeSingle();
      if (!st?.current_streak || st.current_streak < 2) return res.status(200).json({ ok: true, skipped: true });

      await sendOneSignalNotification({
        headings: 'Streak at risk',
        contents: `Don’t lose your ${st.current_streak}-day streak — open LaunchPad today.`,
        externalUserIds: [userId],
        userId,
        category: 'streak',
        url: `${process.env.PUBLIC_APP_URL || ''}/leaderboard`,
        data: { type: 'streak_risk' },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').update({ settings: newSettings, updated_at: new Date().toISOString() }).eq('user_id', userId);
      return res.status(200).json({ ok: true });
    }

    if (type === 'weekly_quests') {
      const key = `weekly_quests_sent_${weekKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      await sendOneSignalNotification({
        headings: 'New weekly quests',
        contents: 'Your weekly quests are ready — earn XP and level up.',
        externalUserIds: [userId],
        userId,
        category: 'quests',
        url: `${process.env.PUBLIC_APP_URL || ''}/leaderboard`,
        data: { type: 'weekly_quests' },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').update({ settings: newSettings, updated_at: new Date().toISOString() }).eq('user_id', userId);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}

