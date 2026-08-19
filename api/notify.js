import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { sendOneSignalNotification } from './_onesignal.js';
import { OPPORTUNITIES } from './seed-opps.js';

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
    const { type, connectionSenderName, bookmarkTitle, bookmarkDeadline, bookmarkLink } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type required' });

    // Fetch user settings from lp_users
    const { data: userRecord } = await supabase.from('lp_users').select('settings').eq('id', userId).maybeSingle();
    const userSettings = userRecord?.settings || {};

    // Fetch track settings from lp_user_extra (rate-limiting)
    const { data: extra } = await supabase.from('lp_user_extra').select('settings').eq('user_id', userId).maybeSingle();
    const settings = extra?.settings || {};

    if (type === 'streak_risk') {
      if (userSettings.notify_streak === false) return res.status(200).json({ ok: true, skipped: 'Preference disabled' });
      const key = `streak_risk_sent_${dayKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      const { data: st } = await supabase.from('lp_streaks').select('current_streak').eq('user_id', userId).maybeSingle();
      if (!st?.current_streak || st.current_streak < 2) return res.status(200).json({ ok: true, skipped: true });

      const heading = 'Streak at risk';
      const content = `Don’t lose your ${st.current_streak}-day streak — open LaunchPad today.`;

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'streak',
        title: heading,
        content,
        data: { type: 'streak_risk' },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'streak',
        url: `${process.env.PUBLIC_APP_URL || ''}/leaderboard`,
        data: { type: 'streak_risk' },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').upsert({ user_id: userId, settings: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      return res.status(200).json({ ok: true });
    }

    if (type === 'weekly_quests') {
      if (userSettings.notify_quests === false) return res.status(200).json({ ok: true, skipped: 'Preference disabled' });
      const key = `weekly_quests_sent_${weekKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      const heading = 'New weekly quests';
      const content = 'Your weekly quests are ready — earn XP and level up.';

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'quests',
        title: heading,
        content,
        data: { type: 'weekly_quests' },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'quests',
        url: `${process.env.PUBLIC_APP_URL || ''}/leaderboard`,
        data: { type: 'weekly_quests' },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').upsert({ user_id: userId, settings: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      return res.status(200).json({ ok: true });
    }

    if (type === 'daily_opportunity') {
      if (userSettings.notify_daily_opportunity === false) return res.status(200).json({ ok: true, skipped: 'Preference disabled' });
      const key = `daily_opportunity_sent_${dayKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      const randomOpp = OPPORTUNITIES[Math.floor(Math.random() * OPPORTUNITIES.length)];
      const heading = 'Daily Scholarship Alert 🎓';
      const content = `New opportunity matching your interests: "${randomOpp.title}" by ${randomOpp.source}. Apply now!`;

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'daily_opportunity',
        title: heading,
        content,
        data: { link: randomOpp.link, title: randomOpp.title },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'opportunities',
        url: `${process.env.PUBLIC_APP_URL || ''}/discover`,
        data: { type: 'daily_opportunity', link: randomOpp.link },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').upsert({ user_id: userId, settings: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      return res.status(200).json({ ok: true });
    }

    if (type === 'trending_opportunity') {
      if (userSettings.notify_trending === false) return res.status(200).json({ ok: true, skipped: 'Preference disabled' });
      const key = `trending_opportunity_sent_${dayKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      const trendingOpp = OPPORTUNITIES[Math.floor(Math.random() * OPPORTUNITIES.length)];
      const heading = 'Trending Opportunity 🔥';
      const content = `Everyone is talking about: "${trendingOpp.title}". Over 50+ students applied today. Check it out!`;

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'trending',
        title: heading,
        content,
        data: { link: trendingOpp.link, title: trendingOpp.title },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'opportunities',
        url: `${process.env.PUBLIC_APP_URL || ''}/discover`,
        data: { type: 'trending', link: trendingOpp.link },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').upsert({ user_id: userId, settings: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      return res.status(200).json({ ok: true });
    }

    if (type === 'inactivity_reminder') {
      if (userSettings.notify_inactivity === false) return res.status(200).json({ ok: true, skipped: 'Preference disabled' });
      const key = `inactivity_sent_${dayKeyUTC()}`;
      if (settings[key]) return res.status(200).json({ ok: true, skipped: true });

      const heading = '👋 We miss you!';
      const content = 'New scholarship and internship matches are waiting for you. Come see what is new today!';

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'inactivity',
        title: heading,
        content,
        data: { type: 'inactivity' },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'streak',
        url: `${process.env.PUBLIC_APP_URL || ''}/discover`,
        data: { type: 'inactivity' },
      });

      const newSettings = { ...settings, [key]: true };
      await supabase.from('lp_user_extra').upsert({ user_id: userId, settings: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      return res.status(200).json({ ok: true });
    }

    if (type === 'new_connection') {
      if (userSettings.notify_community === false) return res.status(200).json({ ok: true, skipped: 'Preference disabled' });
      const sender = connectionSenderName || 'Someone';
      const heading = 'New Connection Request 🤝';
      const content = `${sender} wants to connect with you on LaunchPad.`;

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'connection',
        title: heading,
        content,
        data: { type: 'connection' },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'community',
        url: `${process.env.PUBLIC_APP_URL || ''}/network`,
        data: { type: 'connection' },
      });

      return res.status(200).json({ ok: true });
    }

    if (type === 'application_deadline') {
      if (!bookmarkTitle) return res.status(400).json({ error: 'bookmarkTitle required' });
      const heading = 'Deadline Approaching ⏰';
      const content = `Deadline warning: "${bookmarkTitle}" is due soon (${bookmarkDeadline || 'soon'}). Apply now!`;

      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'deadline',
        title: heading,
        content,
        data: { link: bookmarkLink, title: bookmarkTitle },
        read: false
      });

      await sendOneSignalNotification({
        headings: heading,
        contents: content,
        externalUserIds: [userId],
        userId,
        category: 'opportunities',
        url: `${process.env.PUBLIC_APP_URL || ''}/bookmarks`,
        data: { type: 'deadline', link: bookmarkLink },
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (err) {
    console.error('notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}

