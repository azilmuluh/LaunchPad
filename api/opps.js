import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import { seedOpportunities } from './seed-opps.js';

const JWT_SECRET   = process.env.JWT_SECRET    || 'launchpad-secret-key-2026';
const SERP_API_KEY = process.env.SERP_API_KEY  || '';
const SERPER_KEY   = process.env.SERPER_API_KEY || '';
const NVIDIA_KEY   = process.env.NVIDIA_API_KEY || '';
const CACHE_HOURS  = 12;

let seeded = false;

// ── Category / field helpers ──────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  scholarship: ['scholarship','bursary','fellowship','grant','award','funded','study abroad'],
  internship:  ['internship','intern','trainee','apprentice','placement','attachment'],
  competition: ['competition','contest','challenge','hackathon','olympiad','prize','pitch'],
  event:       ['event','conference','summit','workshop','seminar','webinar','forum','bootcamp'],
  job:         ['job','career','vacancy','hiring','position','employment','recruit','opening'],
};

function detectCategory(title, snippet) {
  const text = (title + ' ' + snippet).toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => text.includes(kw))) return cat;
  }
  return 'opportunity';
}

function extractDeadline(s) {
  const ps = [/deadline[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i, /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/, /apply by ([A-Za-z]+ \d{1,2},?\s*\d{4})/i, /closes?\s+([A-Za-z]+ \d{1,2},?\s*\d{4})/i];
  for (const p of ps) { const m = s.match(p); if (m) return m[1]; }
  return null;
}

function extractEligibility(s) {
  const ps = [/open to ([^.]{5,60})/i, /eligible ([^.]{5,60})/i, /applicants must ([^.]{5,60})/i];
  const found = [];
  for (const p of ps) { const m = s.match(p); if (m) found.push(m[0].trim()); }
  return found.length ? found.join(' • ') : null;
}

function extractBenefits(s) {
  const ps = [/fully funded[^.]*/i, /stipend[^.]*/i, /\$[\d,]+[^.]*/i, /prize[^.]*/i, /grant[^.]*/i];
  const found = [];
  for (const p of ps) { const m = s.match(p); if (m) found.push(m[0].trim()); }
  return found.length ? found.join(' • ') : null;
}

function extractLocation(s) {
  const m = s.match(/(online|virtual|remote|in-person|[A-Z][a-z]+,\s*[A-Z][a-z]+)/i);
  return m ? m[0] : null;
}

function isValidUrl(str) {
  if (!str) return true;
  try { const u = new URL(str); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}

function isValidDeadline(str) {
  if (!str) return true;
  const d = new Date(str);
  if (isNaN(d.getTime())) return false;
  return d.getTime() > new Date('2024-01-01').getTime();
}

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

// ── Search providers ──────────────────────────────────────────────────────────

async function trySerp(q) {
  if (!SERP_API_KEY) return null;
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&gl=cm&hl=en&num=10&api_key=${SERP_API_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    const results = (d.organic_results || []).map(r => ({
      title: r.title || '', link: r.link || '',
      snippet: r.snippet || r.description || '',
      source: (() => { try { return new URL(r.link).hostname.replace('www.',''); } catch { return 'Web'; } })(),
    }));
    return results.length ? results : null;
  } catch { return null; }
}

async function trySerper(q) {
  if (!SERPER_KEY) return null;
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, gl: 'cm', hl: 'en', num: 10 }),
      signal: AbortSignal.timeout(7000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const results = (d.organic || []).map(r => ({
      title: r.title || '', link: r.link || '',
      snippet: r.snippet || '',
      source: (() => { try { return new URL(r.link).hostname.replace('www.',''); } catch { return 'Web'; } })(),
    }));
    return results.length ? results : null;
  } catch { return null; }
}

async function fetchFromSearch(tag) {
  const queries = [
    `${tag} scholarship internship Cameroon Africa 2026`,
    `${tag} job competition opportunity Cameroon 2026`,
  ];
  const all = [];
  for (const q of queries) {
    let results = await trySerp(q);
    if (!results) results = await trySerper(q);
    if (results) all.push(...results);
  }
  return all;
}

async function ensureSeeded() {
  if (seeded) return;
  const { count } = await supabase.from('lp_tag_cache').select('id', { count: 'exact', head: true });
  if (!count || count === 0) await seedOpportunities();
  seeded = true;
}

// ── AI verification ───────────────────────────────────────────────────────────

async function verifyWithAI(title, description, link) {
  if (!NVIDIA_KEY) {
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
      temperature: 0.1, max_tokens: 120,
    });
    const text = completion.choices[0]?.message?.content || '{}';
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      const r = JSON.parse(match[0]);
      return { verified: r.legitimate === true && (r.confidence || 0) >= 60, confidence: r.confidence || 50, reason: r.reason || 'AI review complete' };
    }
  } catch (e) { console.error('AI verify error:', e.message); }
  return { verified: true, confidence: 65, reason: 'Auto-approved (AI unavailable)' };
}

async function awardXP(userId, action, xp) {
  try {
    await supabase.from('lp_xp_log').insert({ user_id: userId, action, xp });
    const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
    const now = new Date().toISOString();
    if (st) {
      const newXP = (st.total_xp || 0) + xp;
      const updates = { total_xp: newXP, level: Math.floor(newXP / 500) + 1, last_seen: now };
      if (action === 'post_opportunity') updates.opps_posted = (st.opps_posted || 0) + 1;
      if (action === 'bookmark') updates.opps_bookmarked = (st.opps_bookmarked || 0) + 1;
      await supabase.from('lp_streaks').update(updates).eq('user_id', userId);
    } else {
      await supabase.from('lp_streaks').insert({ user_id: userId, total_xp: xp, level: 1, current_streak: 1, longest_streak: 1, last_seen: now, opps_posted: action === 'post_opportunity' ? 1 : 0 });
    }
  } catch (e) { console.error('awardXP error:', e.message); }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action } = req.query;

  try {
    // ── LIVE SEARCH OPPORTUNITIES (was /api/opportunities) ────────────────
    if (action === 'search') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const decoded = jwt.verify(token, JWT_SECRET);

      const { data: user } = await supabase.from('lp_users').select('interests, education_level, age').eq('id', decoded.userId).single();
      if (!user) return res.status(404).json({ error: 'User not found' });

      await ensureSeeded();

      const interests = JSON.parse(user.interests || '[]');
      const { page = 1, category = 'all', tag: reqTag } = req.query;
      const pageNum  = parseInt(page) || 1;
      const pageSize = 12;

      const effectiveTags = reqTag
        ? [reqTag]
        : interests.length > 0
          ? interests.slice(0, 10)
          : ['technology','business','engineering','education','medicine','research','entrepreneurship','data_science','arts','agriculture'];

      const now         = new Date();
      const cacheExpiry = new Date(now.getTime() - CACHE_HOURS * 60 * 60 * 1000);
      let allOpps = [];

      for (const tag of effectiveTags) {
        const { data: cached } = await supabase.from('lp_tag_cache').select('*').eq('tag', tag).gte('cached_at', cacheExpiry.toISOString()).maybeSingle();
        if (cached) { try { allOpps.push(...JSON.parse(cached.results || '[]')); } catch {} continue; }

        const rawResults = await fetchFromSearch(tag);
        if (rawResults.length === 0) {
          const { data: staticCache } = await supabase.from('lp_tag_cache').select('results').eq('tag', tag).maybeSingle();
          if (staticCache) { try { allOpps.push(...JSON.parse(staticCache.results || '[]')); } catch {} }
          continue;
        }

        const processed = rawResults.filter(r => r.link && r.title).map((r, i) => ({
          id: `live-${tag}-${i}-${Date.now()}`, title: r.title, link: r.link,
          snippet: r.snippet, description: r.snippet, source: r.source, tag,
          category: detectCategory(r.title, r.snippet),
          deadline: extractDeadline(r.snippet), eligibility: extractEligibility(r.snippet),
          benefits: extractBenefits(r.snippet), location: extractLocation(r.snippet), verified: false,
        }));

        const { data: staticCache } = await supabase.from('lp_tag_cache').select('results').eq('tag', tag).maybeSingle();
        let staticOpps = [];
        if (staticCache) { try { staticOpps = JSON.parse(staticCache.results || '[]').filter(o => o.id?.startsWith('static-')); } catch {} }

        const merged = [...processed, ...staticOpps];
        await supabase.from('lp_tag_cache').upsert({ tag, results: JSON.stringify(merged), cached_at: now.toISOString() }, { onConflict: 'tag' });
        allOpps.push(...merged);
      }

      const userAge = user.age || 0;
      const filtered = allOpps.filter(op => {
        if (!userAge) return true;
        const text = ((op.title||'') + ' ' + (op.snippet||'')).toLowerCase();
        const m = text.match(/age[d]?\s*(\d+)\s*[-–to]+\s*(\d+)/i);
        if (m && (userAge < parseInt(m[1]) || userAge > parseInt(m[2]))) return false;
        return true;
      });

      const seen = new Set();
      const unique = filtered.filter(op => { if (!op.link || seen.has(op.link)) return false; seen.add(op.link); return true; });
      const catFiltered = category === 'all' ? unique : unique.filter(op => op.category === category);
      const start = (pageNum - 1) * pageSize;

      return res.status(200).json({ items: catFiltered.slice(start, start + pageSize), total: catFiltered.length, hasMore: start + pageSize < catFiltered.length, page: pageNum });
    }

    // ── VERIFIED OPPS — LIST (was GET /api/verified-opps) ─────────────────
    if (action === 'verified' && req.method === 'GET') {
      const { page = 1, category = 'all', limit = 12, search = '' } = req.query;
      const pageNum  = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.min(50, parseInt(limit) || 12);
      const start    = (pageNum - 1) * pageSize;
      const end      = start + pageSize - 1;

      let query = supabase.from('lp_verified_opps').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(start, end);
      if (category && category !== 'all') query = query.eq('category', category);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.status(200).json({ items: data || [], total: count || 0, hasMore: end + 1 < (count || 0), page: pageNum });
    }

    // ── VERIFIED OPPS — CREATE (was POST /api/verified-opps) ──────────────
    if (action === 'verified' && req.method === 'POST') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { title, category, description, eligibility, benefits, deadline, link, source, location, tag } = req.body;
      if (!title?.trim())       return res.status(400).json({ error: 'Title is required.' });
      if (!category)            return res.status(400).json({ error: 'Category is required.' });
      if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });
      if (title.trim().length < 10) return res.status(400).json({ error: 'Title must be at least 10 characters.' });
      if (description.trim().length < 30) return res.status(400).json({ error: 'Description must be at least 30 characters.' });
      if (link && !isValidUrl(link)) return res.status(400).json({ error: 'Application link must be a valid URL.' });
      if (deadline && !isValidDeadline(deadline)) return res.status(400).json({ error: 'Deadline must be a valid date.' });

      const { data: userRow } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      if (!userRow) return res.status(404).json({ error: 'User not found.' });

      const verification = await verifyWithAI(title, description, link);

      const { data: opp, error: insertErr } = await supabase.from('lp_verified_opps').insert({
        user_id: userId, user_name: userRow.full_name,
        title: title.trim(), category, description: description.trim(),
        eligibility: eligibility?.trim() || null, benefits: benefits?.trim() || null,
        deadline: deadline?.trim() || null, link: link?.trim() || null,
        source: source?.trim() || null, location: location?.trim() || null,
        tag: tag?.trim() || null,
        verified: verification.verified,
        ai_confidence: verification.confidence,
        upvotes: 0,
      }).select().single();
      if (insertErr) throw insertErr;

      await awardXP(userId, 'post_opportunity', 50);
      return res.status(201).json({ ...opp, verification });
    }

    // ── VERIFIED OPPS — UPVOTE ─────────────────────────────────────────────
    if (action === 'verified' && req.method === 'PUT') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: opp } = await supabase.from('lp_verified_opps').select('upvotes').eq('id', id).single();
      const { data, error } = await supabase.from('lp_verified_opps').update({ upvotes: (opp?.upvotes || 0) + 1 }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ── VERIFIED OPPS — DELETE ─────────────────────────────────────────────
    if (action === 'verified' && req.method === 'DELETE') {
      const userId = uid(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: opp } = await supabase.from('lp_verified_opps').select('user_id').eq('id', id).single();
      if (!opp) return res.status(404).json({ error: 'Not found' });
      if (opp.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('lp_verified_opps').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    res.status(400).json({ error: 'Invalid action. Use ?action=search|verified' });
  } catch (err) {
    console.error('Opps error:', err);
    res.status(500).json({ error: err.message });
  }
}
