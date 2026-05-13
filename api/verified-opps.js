import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || '';

// ── Helpers ────────────────────────────────────────────────────────────────

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

// Validate that a URL is a real, well-formed https/http URL
function isValidUrl(str) {
  if (!str) return true; // optional field
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch { return false; }
}

// Validate that a deadline string is a plausible future-or-recent date
function isValidDeadline(str) {
  if (!str) return true; // optional
  const d = new Date(str);
  if (isNaN(d.getTime())) return false;
  // Must be after Jan 1 2024 (not obviously fake)
  return d.getTime() > new Date('2024-01-01').getTime();
}

async function verifyWithAI(title, description, link) {
  if (!NVIDIA_KEY) {
    // No AI key — do basic heuristic check
    const text = (title + ' ' + description).toLowerCase();
    const spamWords = ['free money', 'click here', 'make money fast', 'guaranteed', 'lottery', 'winner'];
    const isSpam = spamWords.some(w => text.includes(w));
    return { verified: !isSpam, confidence: isSpam ? 10 : 75, reason: isSpam ? 'Spam indicators detected' : 'Basic validation passed' };
  }
  try {
    const client = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });
    const completion = await client.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: `You are a content moderator for an African youth opportunities platform. Is this a legitimate scholarship, internship, competition, event, or job opportunity? Title: "${title}". Description: "${description?.slice(0, 300)}". Link: "${link || 'none'}". Reply ONLY with valid JSON: {"legitimate": true/false, "confidence": 0-100, "reason": "one sentence"}` }],
      temperature: 0.1,
      max_tokens: 120,
    });
    const text = completion.choices[0]?.message?.content || '{}';
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      const r = JSON.parse(match[0]);
      return {
        verified: r.legitimate === true && (r.confidence || 0) >= 60,
        confidence: r.confidence || 50,
        reason: r.reason || 'AI review complete',
      };
    }
  } catch (e) {
    console.error('AI verify error:', e.message);
  }
  return { verified: true, confidence: 65, reason: 'Auto-approved (AI unavailable)' };
}

// ── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── GET — public, paginated, always visible ──────────────────────────
    if (req.method === 'GET') {
      const { page = 1, category = 'all', limit = 12, search = '' } = req.query;
      const pageNum  = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.min(50, parseInt(limit) || 12);
      const start    = (pageNum - 1) * pageSize;
      const end      = start + pageSize - 1;

      let query = supabase
        .from('lp_verified_opps')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (category && category !== 'all') query = query.eq('category', category);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      return res.status(200).json({
        items:   data  || [],
        total:   count || 0,
        hasMore: end + 1 < (count || 0),
        page:    pageNum,
      });
    }

    // All mutating routes require auth
    const userId = uid(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // ── POST — create opportunity ────────────────────────────────────────
    if (req.method === 'POST') {
      const { title, category, description, eligibility, benefits, deadline, link, source, location, tag } = req.body;

      // Input validation
      if (!title?.trim())       return res.status(400).json({ error: 'Title is required.' });
      if (!category)            return res.status(400).json({ error: 'Category is required.' });
      if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });
      if (title.trim().length < 10) return res.status(400).json({ error: 'Title must be at least 10 characters.' });
      if (description.trim().length < 30) return res.status(400).json({ error: 'Description must be at least 30 characters.' });

      // URL validation
      if (link && !isValidUrl(link)) {
        return res.status(400).json({ error: 'Application link must be a valid URL (https://...).' });
      }

      // Deadline validation
      if (deadline && !isValidDeadline(deadline)) {
        return res.status(400).json({ error: 'Deadline must be a valid date (e.g. March 31, 2026).' });
      }

      // Fetch poster name
      const { data: userRow } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      if (!userRow) return res.status(404).json({ error: 'User not found.' });

      // AI verification
      const verification = await verifyWithAI(title, description, link);

      const { data: opp, error: insertErr } = await supabase.from('lp_verified_opps').insert({
        user_id:     userId,
        user_name:   userRow.full_name,
        title:       title.trim(),
        category,
        description: description.trim(),
        eligibility: eligibility?.trim() || null,
        benefits:    benefits?.trim()    || null,
        deadline:    deadline?.trim()    || null,
        link:        link?.trim()        || null,
        source:      source?.trim()      || null,
        location:    location?.trim()    || null,
        tag:         tag?.trim()         || null,
        verified:    verification.verified,
        upvotes:     0,
      }).select().single();

      if (insertErr) throw insertErr;

      // Award XP (+50 for posting)
      await awardXP(userId, 'post_opportunity', 50);

      return res.status(201).json({ ...opp, verification });
    }

    // ── PUT — upvote ─────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: opp } = await supabase.from('lp_verified_opps').select('upvotes').eq('id', id).single();
      const { data, error } = await supabase
        .from('lp_verified_opps')
        .update({ upvotes: (opp?.upvotes || 0) + 1 })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ── DELETE — owner only ──────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: opp } = await supabase.from('lp_verified_opps').select('user_id').eq('id', id).single();
      if (!opp)                  return res.status(404).json({ error: 'Not found' });
      if (opp.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('lp_verified_opps').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('verified-opps error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ── XP helper ─────────────────────────────────────────────────────────────
async function awardXP(userId, action, xp) {
  try {
    await supabase.from('lp_xp_log').insert({ user_id: userId, action, xp });
    const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
    const now = new Date().toISOString();
    if (st) {
      const newXP  = (st.total_xp || 0) + xp;
      const updates = {
        total_xp:     newXP,
        level:        Math.floor(newXP / 500) + 1,
        last_seen:    now,
      };
      if (action === 'post_opportunity') updates.opps_posted = (st.opps_posted || 0) + 1;
      if (action === 'bookmark')         updates.opps_bookmarked = (st.opps_bookmarked || 0) + 1;
      if (action === 'comment')          updates.comments_made = (st.comments_made || 0) + 1;
      if (action === 'community_post')   updates.posts_made = (st.posts_made || 0) + 1;
      await supabase.from('lp_streaks').update(updates).eq('user_id', userId);
    } else {
      await supabase.from('lp_streaks').insert({
        user_id: userId, total_xp: xp, level: 1,
        current_streak: 1, longest_streak: 1, last_seen: now,
        opps_posted: action === 'post_opportunity' ? 1 : 0,
        opps_bookmarked: action === 'bookmark' ? 1 : 0,
        comments_made: action === 'comment' ? 1 : 0,
        posts_made: action === 'community_post' ? 1 : 0,
      });
    }
  } catch (e) { console.error('awardXP error:', e.message); }
}
