import supabase from './_supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2026';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code, name) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: `"LaunchPad" <${gmailUser}>`,
      to: email,
      subject: 'Your LaunchPad verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#F5F0E8;border:3px solid #0A0A0A;border-radius:12px">
          <h1 style="font-size:28px;font-weight:900;margin:0 0 8px">LaunchPad 🚀</h1>
          <p style="color:#666;margin:0 0 24px">Hi ${name}, here is your verification code:</p>
          <div style="background:#0B1E3D;border:3px solid #0A0A0A;border-radius:10px;padding:24px;text-align:center;box-shadow:4px 4px 0 #0A0A0A">
            <p style="color:#FFD600;font-size:12px;font-weight:900;letter-spacing:4px;margin:0 0 12px">YOUR CODE</p>
            <p style="color:#fff;font-size:48px;font-weight:900;letter-spacing:14px;margin:0;font-family:monospace">${code}</p>
          </div>
          <p style="color:#999;font-size:12px;margin:24px 0 0">Expires in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } else {
    // Dev fallback — log to console
    console.log(`[DEV EMAIL] Code for ${email}: ${code}`);
  }
}

async function getExtra(userId) {
  const { data } = await supabase.from('lp_user_extra').select('*').eq('user_id', userId).maybeSingle();
  return data || {};
}

async function getProfile(userId) {
  const { data } = await supabase.from('lp_user_profile').select('*').eq('user_id', userId).maybeSingle();
  return data || {};
}

function serializeUser(u, extra = {}, profile = {}) {
  return {
    id: u.id, email: u.email, full_name: u.full_name,
    interests: u.interests, education_level: u.education_level,
    age: u.age, location: u.location, phone: u.phone,
    avatar_url: extra.avatar_url || null,
    cv_text: extra.cv_text || null,
    email_verified: extra.email_verified || false,
    settings: extra.settings || {},
    created_at: u.created_at,
    account_type: profile.account_type || 'person',
    org_type: profile.org_type || null,
    org_website: profile.org_website || null,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { action } = req.query;

    // ── Send verification code ──────────────────────────────────────────────
    if (action === 'send-code' && req.method === 'POST') {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });

      const code = generateCode();
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Delete any existing codes for this email first, then insert fresh
      await supabase.from('lp_email_verifications').delete().eq('email', email);
      const { error: insertErr } = await supabase.from('lp_email_verifications').insert({
        email,
        code,
        expires_at,
        verified: false,
      });
      if (insertErr) {
        console.error('Insert verification code error:', insertErr);
        return res.status(500).json({ error: 'Could not save verification code' });
      }

      // Send email (non-blocking failure in dev)
      const devMode = !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD;
      try {
        await sendVerificationEmail(email, code, name || 'there');
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
        if (!devMode) {
          return res.status(500).json({ error: 'Failed to send email. Check Gmail credentials.' });
        }
        // In dev mode: continue and return the code in the response
      }

      // In dev mode (no Gmail creds), return code so it can be shown in UI
      const resp = { ok: true };
      if (devMode) resp.dev_code = code;
      return res.status(200).json(resp);
    }

    // ── Verify code ─────────────────────────────────────────────────────────
    if (action === 'verify-code' && req.method === 'POST') {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

      // Fetch the most recent code for this email
      const { data: rows, error: fetchErr } = await supabase
        .from('lp_email_verifications')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchErr) {
        console.error('Fetch verification error:', fetchErr);
        return res.status(500).json({ error: 'Verification lookup failed' });
      }

      const rec = rows?.[0];
      if (!rec) return res.status(400).json({ error: 'No code was sent to this email. Please request a new code.' });

      // Trim both sides to avoid whitespace issues
      const submittedCode = String(code).trim();
      const storedCode = String(rec.code).trim();

      if (storedCode !== submittedCode) {
        return res.status(400).json({ error: `Incorrect code. Please check and try again.` });
      }

      if (new Date(rec.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
      }

      // Mark as verified
      await supabase.from('lp_email_verifications').update({ verified: true }).eq('id', rec.id);
      return res.status(200).json({ ok: true });
    }

    // ── Signup ──────────────────────────────────────────────────────────────
    if (action === 'signup' && req.method === 'POST') {
      const { email, password, full_name, phone, interests, education_level, age, location, cv_text } = req.body;
      if (!email || !password || !full_name) return res.status(400).json({ error: 'Missing required fields' });

      // Check email was verified
      const { data: verRows } = await supabase
        .from('lp_email_verifications')
        .select('verified')
        .eq('email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1);

      const verRec = verRows?.[0];
      if (!verRec?.verified) {
        return res.status(400).json({ error: 'Please verify your email before creating an account.' });
      }

      const { data: existing } = await supabase.from('lp_users').select('id').eq('email', email).maybeSingle();
      if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

      const password_hash = await bcrypt.hash(password, 10);
      const { data: user, error } = await supabase.from('lp_users').insert({
        email: email.toLowerCase().trim(),
        password_hash, full_name, phone,
        interests: JSON.stringify(interests || []),
        education_level: education_level || null,
        age: parseInt(age) || null,
        location: location || null,
      }).select().single();
      if (error) throw error;

      // Create extra record
      await supabase.from('lp_user_extra').insert({
        user_id: user.id,
        cv_text: cv_text || null,
        email_verified: true,
        settings: {},
      });

      // Save org profile
      const accountType = req.body.account_type || 'person';
      await supabase.from('lp_user_profile').insert({
        user_id: user.id,
        account_type: accountType,
        org_type: req.body.org_type || null,
        org_website: req.body.org_website || null,
      });

      // Clean up verification record
      await supabase.from('lp_email_verifications').delete().eq('email', email);

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      const extra = await getExtra(user.id);
      const profile = await getProfile(user.id);
      return res.status(201).json({ token, user: serializeUser(user, extra, profile) });
    }

    // ── Login ───────────────────────────────────────────────────────────────
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
      const { data: user, error } = await supabase.from('lp_users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
      if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      const extra = await getExtra(user.id);
      const profile = await getProfile(user.id);
      return res.status(200).json({ token, user: serializeUser(user, extra, profile) });
    }

    // ── Me ──────────────────────────────────────────────────────────────────
    if (action === 'me' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'No token' });
      const decoded = jwt.verify(token, JWT_SECRET);
      const { data: user, error } = await supabase.from('lp_users').select('*').eq('id', decoded.userId).maybeSingle();
      if (error || !user) return res.status(404).json({ error: 'User not found' });
      const extra = await getExtra(user.id);
      const profile = await getProfile(user.id);
      return res.status(200).json({ user: serializeUser(user, extra, profile) });
    }

    // ── Update profile ──────────────────────────────────────────────────────
    if (action === 'update' && req.method === 'PUT') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'No token' });
      const decoded = jwt.verify(token, JWT_SECRET);
      const { full_name, phone, education_level, age, location, interests, avatar_url, cv_text, settings } = req.body;

      const userUpdates = {};
      if (full_name !== undefined)       userUpdates.full_name = full_name;
      if (phone !== undefined)           userUpdates.phone = phone;
      if (education_level !== undefined) userUpdates.education_level = education_level;
      if (age !== undefined)             userUpdates.age = parseInt(age) || null;
      if (location !== undefined)        userUpdates.location = location;
      if (interests !== undefined)       userUpdates.interests = JSON.stringify(interests);

      let user;
      if (Object.keys(userUpdates).length > 0) {
        const { data, error } = await supabase.from('lp_users').update(userUpdates).eq('id', decoded.userId).select().single();
        if (error) throw error;
        user = data;
      } else {
        const { data } = await supabase.from('lp_users').select('*').eq('id', decoded.userId).single();
        user = data;
      }

      const extraUpdates = { updated_at: new Date().toISOString() };
      if (avatar_url !== undefined) extraUpdates.avatar_url = avatar_url;
      if (cv_text !== undefined)    extraUpdates.cv_text = cv_text;
      if (settings !== undefined)   extraUpdates.settings = settings;

      const { data: existingExtra } = await supabase.from('lp_user_extra').select('id').eq('user_id', decoded.userId).maybeSingle();
      if (existingExtra) {
        await supabase.from('lp_user_extra').update(extraUpdates).eq('user_id', decoded.userId);
      } else {
        await supabase.from('lp_user_extra').insert({ user_id: decoded.userId, ...extraUpdates });
      }

      const extra = await getExtra(decoded.userId);
      const profile = await getProfile(decoded.userId);
      return res.status(200).json({ user: serializeUser(user, extra, profile) });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: err.message });
  }
}
