import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || '';

const openai = new OpenAI({
  apiKey: NVIDIA_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export const BADGE_DEFS = {
  first_post:       { label: 'First Post',       icon: '\uD83D\uDCDD', xp: 20,  desc: 'Published your first community post',         threshold: 1  },
  first_opp:        { label: 'Trailblazer',       icon: '\uD83D\uDE80', xp: 50,  desc: 'Posted your first opportunity',               threshold: 1  },
  first_bookmark:   { label: 'Collector',         icon: '\uD83D\uDD16', xp: 10,  desc: 'Bookmarked your first opportunity',            threshold: 1  },
  first_comment:    { label: 'Conversationalist', icon: '\uD83D\uDCAC', xp: 10,  desc: 'Left your first comment',                     threshold: 1  },
  streak_3:         { label: '3-Day Streak',      icon: '\uD83D\uDD25', xp: 30,  desc: 'Used LaunchPad 3 days in a row',              threshold: 3  },
  streak_7:         { label: 'Week Warrior',      icon: '\u26A1',       xp: 75,  desc: 'Used LaunchPad 7 days in a row',              threshold: 7  },
  streak_30:        { label: 'Unstoppable',       icon: '\uD83C\uDFC6', xp: 200, desc: 'Used LaunchPad 30 days in a row',             threshold: 30 },
  posts_5:          { label: 'Voice of the Crowd',icon: '\uD83C\uDFA4', xp: 40,  desc: 'Published 5 community posts',                threshold: 5  },
  opps_3:           { label: 'Opportunity Hunter',icon: '\uD83C\uDFAF', xp: 75,  desc: 'Posted 3 opportunities',                     threshold: 3  },
  comments_10:      { label: 'Community Pillar',  icon: '\uD83C\uDFDB', xp: 60,  desc: 'Left 10 comments',                           threshold: 10 },
  bookmarks_5:      { label: 'Curator',           icon: '\uD83D\uDCDA', xp: 25,  desc: 'Bookmarked 5 opportunities',                 threshold: 5  },
  circle_maker:     { label: 'Circle Maker',      icon: '\uD83D\uDC65', xp: 50,  desc: 'Created your first Circle',                  threshold: 1  },
  circle_joiner:    { label: 'Team Player',        icon: '\uD83E\uDD1D', xp: 20,  desc: 'Joined your first Circle',                   threshold: 1  },
  profile_complete: { label: 'Identity',           icon: '\uD83C\uDF9F', xp: 30,  desc: 'Completed your full profile',                threshold: 1  },
  cv_uploaded:      { label: 'Resume Ready',       icon: '\uD83D\uDCC4', xp: 25,  desc: 'Uploaded your CV',                           threshold: 1  },
  expert:           { label: 'Expert',             icon: '💎',           xp: 500, desc: 'Reached Level 10',                          threshold: 10 },
};

async function sendBadgeEmail(email, name, badge, allBadges) {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_PASS = process.env.GMAIL_PASS;

  if (!GMAIL_USER || !GMAIL_PASS) {
    console.log(`[DEV] Badge email to ${email}: earned ${badge.label} (GMAIL_USER or GMAIL_PASS missing)`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  // Build "what to do next" suggestions
  const earned = new Set(allBadges.map(b => b.badge_key));
  const suggestions = Object.entries(BADGE_DEFS)
    .filter(([key]) => !earned.has(key))
    .slice(0, 3)
    .map(([, def]) => `<li style="margin:6px 0"><strong>${def.icon} ${def.label}</strong> &mdash; ${def.desc} <em>(+${def.xp} XP)</em></li>`)
    .join('');

  const mailOptions = {
    from: `"LaunchPad" <${GMAIL_USER}>`,
    to: email,
    subject: `${badge.icon} You earned the "${badge.label}" badge!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#F5F0E8;border:3px solid #0A0A0A;border-radius:12px">
        <h1 style="font-size:24px;font-weight:900;margin:0 0 4px">LaunchPad 🚀</h1>
        <p style="color:#666;margin:0 0 24px;font-size:14px">Hi ${name}, you just earned a new badge!</p>
        <div style="background:#0B1E3D;border:3px solid #0A0A0A;border-radius:10px;padding:24px;text-align:center;box-shadow:4px 4px 0 #FF5C00;margin-bottom:24px">
          <div style="font-size:52px;margin-bottom:8px">${badge.icon}</div>
          <h2 style="color:#FFD600;font-size:22px;font-weight:900;margin:0 0 4px">${badge.label}</h2>
          <p style="color:#aaa;font-size:13px;margin:0 0 12px">${badge.desc}</p>
          <div style="display:inline-block;background:#FF5C00;color:#fff;font-weight:900;padding:6px 18px;border-radius:20px;border:2px solid #FFD600">+${badge.xp} XP</div>
        </div>
        <h3 style="font-size:16px;font-weight:900;margin:0 0 12px">Keep going! Earn these next:</h3>
        <ul style="padding-left:20px;color:#333;font-size:14px">${suggestions}</ul>
        <p style="margin-top:24px;font-size:12px;color:#999">Keep building your future with LaunchPad.</p>
      </div>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (e) {
    console.error('Badge email error:', e.message);
  }
}

export async function checkAndAwardBadges(userId, userEmail, userName) {
  // Get current stats
  const [streakRow, postsRow, oppsRow, commentsRow, engageCommentsRow, bookmarksRow, circlesCreated, circlesJoined, extraRow] = await Promise.all([
    supabase.from('lp_streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),
    supabase.from('lp_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lp_verified_opps').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lp_comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lp_engagement_comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lp_bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lp_circles_v2').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('lp_circle_members_v2').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lp_user_extra').select('cv_text').eq('user_id', userId).single(),
  ]);
  const [userRow] = await Promise.all([
    supabase.from('lp_users').select('full_name, location, education_level, age').eq('id', userId).single(),
  ]);

  const streak   = streakRow.data?.current_streak || 0;
  const posts    = postsRow.count || 0;
  const opps     = oppsRow.count || 0;
  const comments = (commentsRow.count || 0) + (engageCommentsRow.count || 0);
  const bookmarks = bookmarksRow.count || 0;
  const circlesMade = circlesCreated.count || 0;
  const circlesIn   = circlesJoined.count || 0;
  const hasCv       = !!extraRow.data?.cv_text;
  const u           = userRow.data;
  const profileComplete = !!(u?.full_name && u?.location && u?.education_level && u?.age);

  const checks = [
    { key: 'first_post',       met: posts >= 1 },
    { key: 'first_opp',        met: opps >= 1 },
    { key: 'first_bookmark',   met: bookmarks >= 1 },
    { key: 'first_comment',    met: comments >= 1 },
    { key: 'streak_3',         met: streak >= 3 },
    { key: 'streak_7',         met: streak >= 7 },
    { key: 'streak_30',        met: streak >= 30 },
    { key: 'posts_5',          met: posts >= 5 },
    { key: 'opps_3',           met: opps >= 3 },
    { key: 'comments_10',      met: comments >= 10 },
    { key: 'bookmarks_5',      met: bookmarks >= 5 },
    { key: 'circle_maker',     met: circlesMade >= 1 },
    { key: 'circle_joiner',    met: circlesIn >= 1 },
    { key: 'profile_complete', met: profileComplete },
    { key: 'cv_uploaded',      met: hasCv },
    { key: 'expert',           met: (streakRow.data?.level || 1) >= 10 },
  ];

  // Get already earned badges
  const { data: existing } = await supabase.from('lp_badges').select('badge_key').eq('user_id', userId);
  const earned = new Set((existing || []).map(b => b.badge_key));

  const newBadges = [];
  for (const { key, met } of checks) {
    if (met && !earned.has(key)) {
      const def = BADGE_DEFS[key];
      await supabase.from('lp_badges').insert({ user_id: userId, badge_key: key, badge_label: def.label, badge_icon: def.icon, xp_awarded: def.xp });
      // Award XP
      await supabase.from('lp_streaks').upsert({ user_id: userId, total_xp: 0 }, { onConflict: 'user_id', ignoreDuplicates: true });
      const { data: st } = await supabase.from('lp_streaks').select('total_xp').eq('user_id', userId).single();
      const newXp = (st?.total_xp || 0) + def.xp;
      await supabase.from('lp_streaks').update({ total_xp: newXp, level: Math.floor(newXp / 500) + 1 }).eq('user_id', userId);
      newBadges.push({ ...def, key });
      earned.add(key);

      // Create notification
      await supabase.from('lp_notifications').insert({
        user_id: userId,
        type: 'badge_unlock',
        title: 'New Badge Unlocked!',
        content: `You earned the ${def.label} badge! (+${def.xp} XP)`,
        data: { badge_key: key, icon: def.icon },
        read: false
      });
    }
  }

  if (newBadges.length > 0 && userEmail) {
    const allBadges = await supabase.from('lp_badges').select('badge_key').eq('user_id', userId);
    for (const badge of newBadges) {
      await sendBadgeEmail(userEmail, userName || 'there', badge, allBadges.data || []);
    }
  }

  return newBadges;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('lp_badges').select('*').eq('user_id', decoded.userId).order('earned_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ badges: data || [], definitions: BADGE_DEFS });
    }

    // POST — trigger a badge check
    if (req.method === 'POST') {
      const { data: user } = await supabase.from('lp_users').select('email, full_name').eq('id', decoded.userId).single();
      const newBadges = await checkAndAwardBadges(decoded.userId, user?.email, user?.full_name);
      return res.status(200).json({ new_badges: newBadges });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Badges error:', err);
    res.status(500).json({ error: err.message });
  }
}
