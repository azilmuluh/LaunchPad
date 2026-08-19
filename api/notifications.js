import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET;
// Support both naming conventions: GMAIL_USER or SMTP_USER
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';

// Helpers
function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// ── PUSH NOTIFICATION TEMPLATES ──────────────────────────────────────────

async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // Get user's push subscriptions
    const { data: subs } = await supabase
      .from('lp_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)
      .eq('active', true);

    if (!subs || subs.length === 0) return false;

    // Send to each subscription
    for (const sub of subs) {
      try {
        await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '24',
          },
          body: JSON.stringify({
            notification: {
              title,
              body,
              icon: 'https://launchpadcm.netlify.app/LaunchPad.svg',
              badge: 'https://launchpadcm.netlify.app/LaunchPad.svg',
              tag: data.tag || 'notification',
              data,
            },
          }),
        });
      } catch (e) {
        console.error('Push send error:', e.message);
      }
    }
    return true;
  } catch (e) {
    console.error('Push notification error:', e.message);
    return false;
  }
}

// ── EMAIL TEMPLATES ──────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('Email not configured, skipping:', subject);
    return false;
  }
  
  try {
    await emailTransporter.sendMail({
      from: `LaunchPad <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
    console.error('Email send error:', e.message);
    return false;
  }
}

// Email templates
function emailNewConnection(userName, connectorName, profileUrl) {
  return `
    <div style="font-family: 'Space Grotesk', Arial; background: #FFFDF7; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border: 3px solid #0A0A0A; border-radius: 12px; padding: 30px;">
        <h1 style="font-weight: 900; color: #0A0A0A; margin-bottom: 20px;">🤝 New Connection!</h1>
        <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
          Hey <strong>${userName}</strong>,
        </p>
        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          <strong>${connectorName}</strong> connected with you! 🎉
        </p>
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          You're now part of an even stronger community. Connect with peers, share opportunities, and grow together.
        </p>
        <a href="${profileUrl}" style="display: inline-block; background: #FF5C00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; border: 2px solid #0A0A0A; box-shadow: 3px 3px 0 #0A0A0A;">
          View Profile
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 2px solid #f0f0f0; padding-top: 20px;">
          Keep exploring opportunities and connecting with the LaunchPad community!
        </p>
      </div>
    </div>
  `;
}

function emailNewBadge(userName, badgeName, badgeDescription) {
  return `
    <div style="font-family: 'Space Grotesk', Arial; background: #FFFDF7; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border: 3px solid #0A0A0A; border-radius: 12px; padding: 30px;">
        <h1 style="font-weight: 900; color: #0A0A0A; margin-bottom: 20px;">🏅 New Badge Unlocked!</h1>
        <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
          Hey <strong>${userName}</strong>,
        </p>
        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          Congratulations! You've unlocked the <strong>${badgeName}</strong> badge! 🎊
        </p>
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          ${badgeDescription}
        </p>
        <p style="font-size: 14px; color: #999; margin-bottom: 25px;">
          Keep up the amazing work! Your engagement is making a difference in the LaunchPad community.
        </p>
        <a href="https://launchpadcm.netlify.app/profile" style="display: inline-block; background: #FF5C00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; border: 2px solid #0A0A0A; box-shadow: 3px 3px 0 #0A0A0A;">
          View Your Badges
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 2px solid #f0f0f0; padding-top: 20px;">
          Your achievements matter to us!
        </p>
      </div>
    </div>
  `;
}

function emailOpportunityDeadlineReminder(userName, oppTitle, daysLeft, applyUrl) {
  return `
    <div style="font-family: 'Space Grotesk', Arial; background: #FFFDF7; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border: 3px solid #0A0A0A; border-radius: 12px; padding: 30px;">
        <h1 style="font-weight: 900; color: #FF5C00; margin-bottom: 20px;">⏰ Deadline Reminder</h1>
        <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
          Hi <strong>${userName}</strong>,
        </p>
        <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
          The deadline for <strong>${oppTitle}</strong> is in <strong style="color: #FF5C00;">${daysLeft} days</strong>! Don't miss out.
        </p>
        <p style="font-size: 14px; color: #666; margin-bottom: 25px;">
          This is a great opportunity. Start your application today to avoid last-minute stress.
        </p>
        <a href="${applyUrl}" style="display: inline-block; background: #FF5C00; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; border: 2px solid #0A0A0A; box-shadow: 3px 3px 0 #0A0A0A;">
          Start Application
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 2px solid #f0f0f0; padding-top: 20px;">
          LaunchPad: Guiding Youth to Opportunity
        </p>
      </div>
    </div>
  `;
}

// ── ENGAGEMENT TRIGGERS ──────────────────────────────────────────────────

export async function triggerNewConnectionNotification(userId, connectorId) {
  try {
    const { data: user } = await supabase.from('lp_users').select('full_name, email').eq('id', userId).single();
    const { data: connector } = await supabase.from('lp_users').select('full_name').eq('id', connectorId).single();
    
    if (!user || !connector) return false;

    // Push notification
    await sendPushNotification(
      userId,
      '🤝 New Connection!',
      `${connector.full_name} connected with you!`,
      {
        tag: 'connection',
        userId: connectorId,
        action: 'view_profile',
      }
    );

    // Email notification
    const profileUrl = `https://launchpadcm.netlify.app/profile?user=${connectorId}`;
    await sendEmail(
      user.email,
      `🤝 New Connection: ${connector.full_name}`,
      emailNewConnection(user.full_name, connector.full_name, profileUrl)
    );

    // Log engagement
    await supabase.from('lp_engagement_log').insert({
      user_id: userId,
      event_type: 'connection_received',
      related_user_id: connectorId,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error('New connection notification error:', e.message);
    return false;
  }
}

export async function triggerBadgeUnlockedNotification(userId, badgeName, badgeDescription) {
  try {
    const { data: user } = await supabase.from('lp_users').select('full_name, email').eq('id', userId).single();
    
    if (!user) return false;

    // Push notification
    await sendPushNotification(
      userId,
      '🏅 Badge Unlocked!',
      `You've earned the ${badgeName} badge!`,
      {
        tag: 'badge',
        badge: badgeName,
        action: 'view_profile',
      }
    );

    // Email notification
    await sendEmail(
      user.email,
      `🏅 You Unlocked a New Badge: ${badgeName}`,
      emailNewBadge(user.full_name, badgeName, badgeDescription)
    );

    // Log engagement
    await supabase.from('lp_engagement_log').insert({
      user_id: userId,
      event_type: 'badge_unlocked',
      metadata: { badge: badgeName },
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error('Badge notification error:', e.message);
    return false;
  }
}

export async function triggerOpportunityDeadlineReminder(userId, opportunityId) {
  try {
    const { data: user } = await supabase.from('lp_users').select('full_name, email').eq('id', userId).single();
    const { data: opp } = await supabase.from('lp_opportunities').select('title, id, deadline').eq('id', opportunityId).single();
    
    if (!user || !opp) return false;

    const daysLeft = Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return false; // Already passed

    // Push notification
    await sendPushNotification(
      userId,
      '⏰ Deadline Approaching',
      `${opp.title} deadline in ${daysLeft} days!`,
      {
        tag: 'deadline',
        opportunityId,
        action: 'apply',
      }
    );

    // Email notification
    const applyUrl = `https://launchpadcm.netlify.app/opportunities/${opportunityId}/apply`;
    await sendEmail(
      user.email,
      `⏰ Deadline Reminder: ${opp.title}`,
      emailOpportunityDeadlineReminder(user.full_name, opp.title, daysLeft, applyUrl)
    );

    // Log engagement
    await supabase.from('lp_engagement_log').insert({
      user_id: userId,
      event_type: 'deadline_reminder',
      opportunity_id: opportunityId,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (e) {
    console.error('Deadline reminder error:', e.message);
    return false;
  }
}

// ── API HANDLER ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── POST: Subscribe to push notifications ───────────────────────────
    if (req.method === 'POST' && req.body.action === 'subscribe') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      const { error } = await supabase.from('lp_push_subscriptions').insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        active: true,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      return res.status(201).json({ ok: true });
    }

    // ── POST: Unsubscribe from push notifications ────────────────────────
    if (req.method === 'POST' && req.body.action === 'unsubscribe') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { endpoint } = req.body;
      await supabase.from('lp_push_subscriptions').update({ active: false }).eq('endpoint', endpoint);

      return res.status(200).json({ ok: true });
    }

    // ── POST: Trigger notifications (internal use) ──────────────────────
    if (req.method === 'POST' && req.body.action === 'trigger') {
      const { trigger_type, user_id, data } = req.body;

      if (trigger_type === 'new_connection') {
        await triggerNewConnectionNotification(user_id, data.connector_id);
      } else if (trigger_type === 'badge_unlocked') {
        await triggerBadgeUnlockedNotification(user_id, data.badge_name, data.badge_description);
      } else if (trigger_type === 'deadline_reminder') {
        await triggerOpportunityDeadlineReminder(user_id, data.opportunity_id);
      }

      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: err.message });
  }
}
