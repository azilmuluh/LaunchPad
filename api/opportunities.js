import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { seedOpportunities } from './seed-opps.js';

const JWT_SECRET    = process.env.JWT_SECRET;
const SERP_API_KEY  = process.env.SERP_API_KEY;
const SERPER_KEY    = process.env.SERPER_API_KEY;
const CACHE_HOURS   = 12;

if (!SERPER_KEY && !SERP_API_KEY) {
  console.error('[Opportunities] CRITICAL: Both Search API keys are missing! Live search will not work.');
}

let seeded = false; // in-process flag to avoid re-seeding every request

const CATEGORY_KEYWORDS = {
  scholarship: ['scholarship','bursary','fellowship','grant','award','funded','study abroad','financial aid', 'stipend'],
  internship:  ['internship','intern','trainee','apprentice','placement','attachment','co-op', 'work-study'],
  competition: ['competition','contest','challenge','hackathon','olympiad','prize','pitch','hack', 'tournament'],
  event:       ['event','conference','summit','workshop','seminar','webinar','forum','bootcamp','meetup', 'training'],
  job:         ['job','career','vacancy','hiring','position','employment','recruit','opening','full-time', 'part-time', 'remote work'],
};

function detectCategory(title, snippet) {
  const text = (title + ' ' + snippet).toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => text.includes(kw))) return cat;
  }
  return 'opportunity';
}

function extractDeadline(s) {
  const ps = [
    /deadline[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
    /([A-Z][a-z]+ \d{1,2}, \d{4})/,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /apply by ([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
    /closes?\s+([A-Za-z]+ \d{1,2},?\s*\d{4})/i
  ];
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

// ── Search providers with automatic failover ─────────────────────────────────

async function trySerp(q) {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&gl=cm&hl=en&num=10&api_key=${SERP_API_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) {
      console.warn(`[SERP] HTTP ${r.status} — switching to Serper`);
      return null;
    }
    const d = await r.json();
    // SerpAPI returns HTTP 200 with an error field when quota is exceeded
    if (d.error) {
      console.warn('[SERP] quota/error:', d.error, '— switching to Serper');
      return null;
    }
    const results = (d.organic_results || []).map(r => ({
      title: r.title || '', link: r.link || '',
      snippet: r.snippet || r.description || '',
      source: (() => { try { return new URL(r.link).hostname.replace('www.',''); } catch { return 'Web'; } })(),
    }));
    return results.length ? results : null;
  } catch (e) {
    console.warn('[SERP] fetch error:', e.message, '— switching to Serper');
    return null;
  }
}

async function trySerper(q) {
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
  } catch (e) { console.warn('[Serper] fetch error:', e.message); return null; }
}

async function fetchFromSearch(tag) {
  const queries = [
    `${tag} scholarships internships for African students 2026`,
    `${tag} opportunities Cameroon 2026`,
    `${tag} competitions global 2026`,
  ];
  const all = [];
  for (const q of queries) {
    // Try SerpAPI → Serper → skip
    let results = await trySerp(q);
    if (!results) {
      console.log(`[Search] SerpAPI failed for "${q}", trying Serper…`);
      results = await trySerper(q);
    }
    if (!results) console.log(`[Search] Both APIs failed for "${q}", using static library.`);
    if (results) all.push(...results);
  }
  return all;
}

// ── Auto-ensure static seed exists ───────────────────────────────────────────
async function ensureSeeded() {
  if (seeded) return;
  const { count } = await supabase.from('lp_tag_cache').select('id', { count: 'exact', head: true });
  if (!count || count === 0) {
    console.log('[Seed] Cache empty — seeding static library…');
    await seedOpportunities();
  }
  seeded = true;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user } = await supabase
      .from('lp_users').select('interests, education_level, age').eq('id', decoded.userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Ensure static seed exists
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
      // Check cache
      const { data: cached } = await supabase
        .from('lp_tag_cache').select('*').eq('tag', tag)
        .gte('cached_at', cacheExpiry.toISOString()).maybeSingle();

      let tagResults = [];
      if (cached) {
        try { tagResults = JSON.parse(cached.results || '[]'); } catch {}
      } else {
        // Fetch live from search APIs
        console.log(`[Search] Fetching live for tag: ${tag}`);
        const rawResults = (SERPER_KEY || SERP_API_KEY) ? await fetchFromSearch(tag) : [];
        tagResults = rawResults.filter(r => r.link && r.title).map((r, i) => {
          const hash = Buffer.from(r.link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
          return {
            id: `live-${tag}-${hash}`,
            title: r.title, link: r.link, snippet: r.snippet, description: r.snippet,
            source: r.source, tag, category: detectCategory(r.title, r.snippet),
            deadline: extractDeadline(r.snippet), eligibility: extractEligibility(r.snippet),
            benefits: extractBenefits(r.snippet), location: extractLocation(r.snippet),
            verified: false,
          };
        });

        // Get static opps for this tag
        const { data: staticCache } = await supabase.from('lp_tag_cache').select('results').eq('tag', tag).maybeSingle();
        if (staticCache) {
          try { 
            const staticOpps = JSON.parse(staticCache.results || '[]').filter(o => o.id?.startsWith('static-'));
            tagResults = [...tagResults, ...staticOpps];
          } catch {}
        }

        // Save to cache
        await supabase.from('lp_tag_cache').upsert(
          { tag, results: JSON.stringify(tagResults), cached_at: now.toISOString() },
          { onConflict: 'tag' }
        );
      }

      // Filter out expired ones
      const active = tagResults.filter(op => {
        if (!op.deadline) return true;
        try {
          const d = new Date(op.deadline);
          return isNaN(d.getTime()) || d >= now;
        } catch { return true; }
      });

      // Personalization Score: Boost Cameroon, Africa, and multiple interest matches
      const scored = active.map(op => {
        let score = 0;
        const text = (op.title + ' ' + op.snippet).toLowerCase();
        if (text.includes('cameroon') || text.includes('cmr')) score += 100;
        if (text.includes('africa')) score += 30;
        // Check for other user interests
        interests.forEach(interest => {
          if (text.includes(interest.toLowerCase())) score += 20;
        });
        return { ...op, _score: score };
      });

      // Filter out common noise
      const clean = scored.filter(op => {
        const t = (op.title + ' ' + op.snippet).toLowerCase();
        const noise = ['privacy policy', 'terms of service', 'login', 'signup', 'forgot password', 'cookies', '404 not found'];
        return !noise.some(n => t.includes(n));
      });

      allOpps.push(...clean);
    }

    // 2. Strict Filtering (Interests, Age, Education)
    const userAge = user.age || 0;
    const userEd  = (user.education_level || '').toLowerCase();
    
    const filtered = allOpps.filter(op => {
      const text = ((op.title||'') + ' ' + (op.snippet||'') + ' ' + (op.eligibility||'')).toLowerCase();
      
      // Age filter
      if (userAge > 0) {
        const m = text.match(/age[d]?\s*(\d+)\s*[-–to]+\s*(\d+)/i);
        if (m && (userAge < parseInt(m[1]) || userAge > parseInt(m[2]))) return false;
      }

      // Education level filter
      // If user is High School, they shouldn't see PhD opportunities
      if (userEd) {
        if (userEd.includes('high school')) {
          if (text.includes('phd') || text.includes('graduate student') || text.includes('masters degree')) return false;
        }
        if (userEd.includes('undergraduate') || userEd.includes('bachelor')) {
          if (text.includes('phd') || text.includes('postdoc')) return false;
        }
        // If the opportunity specifically asks for a level the user doesn't have
        const levels = ['high school', 'undergraduate', 'bachelor', 'masters', 'phd', 'postdoc'];
        for (const l of levels) {
          if (text.includes(l) && !userEd.includes(l)) {
             // If user is 'masters' and op says 'phd only', filter it
             if (l === 'phd' && !userEd.includes('phd')) return false;
             if (l === 'masters' && userEd.includes('undergraduate')) return false;
          }
        }
      }

      return true;
    });

    // Deduplicate
    const seen = new Set();
    const unique = filtered.filter(op => {
      if (!op.link || seen.has(op.link)) return false;
      seen.add(op.link); return true;
    });

    // Sort by score (descending)
    unique.sort((a, b) => (b._score || 0) - (a._score || 0));

    // Category filter
    const catFiltered = category === 'all' ? unique : unique.filter(op => op.category === category);

    const start = (pageNum - 1) * pageSize;
    return res.status(200).json({
      items: catFiltered.slice(start, start + pageSize),
      total: catFiltered.length,
      hasMore: start + pageSize < catFiltered.length,
      page: pageNum,
      sources: { serp: true, serper: true, static: true },
    });

  } catch (err) {
    console.error('Opportunities error:', err);
    res.status(500).json({ error: err.message });
  }
}
