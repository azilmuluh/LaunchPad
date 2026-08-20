import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { seedOpportunities } from './seed-opps.js';
import {
  filterOpportunities,
  sortOpportunities,
  isSpecificOpportunity,
  getSpecificityScore,
} from './_opportunity-quality.js';

const JWT_SECRET    = process.env.JWT_SECRET;
const SERP_API_KEY  = process.env.SERP_API_KEY;
const SERPER_KEY    = process.env.SERPER_API_KEY;
const CACHE_HOURS   = 12;

if (!SERPER_KEY && !SERP_API_KEY) {
  console.error('[Opportunities] CRITICAL: Both Search API keys are missing! Live search will not work.');
}

let seeded = false;

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

function extractAmount(s) {
  const match = s.match(/(fully funded|\$[\d,]+|€[\d,]+|£[\d,]+|[\d,]+\s*(?:FCFA|CFA))/i);
  return match ? match[1] : 'Full Funding / Varies';
}

function extractDegreeLevel(s) {
  const text = s.toLowerCase();
  if (text.includes('phd') || text.includes('postdoc') || text.includes('doctoral')) return 'PhD / Postdoc';
  if (text.includes('master') || text.includes('msc') || text.includes('mba')) return 'Master\'s';
  if (text.includes('undergraduate') || text.includes('bachelor') || text.includes('bsc')) return 'Undergraduate';
  if (text.includes('high school') || text.includes('secondary')) return 'High School';
  return 'All Levels';
}

function extractCountryFocus(s) {
  const text = s.toLowerCase();
  if (text.includes('cameroon')) return 'Cameroon';
  if (text.includes('africa') || text.includes('pan-african')) return 'Africa';
  if (text.includes('global') || text.includes('worldwide') || text.includes('any country')) return 'Global';
  const countries = ['nigeria', 'kenya', 'ghana', 'south africa', 'uganda', 'rwanda'];
  for (const c of countries) {
    if (text.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return 'Africa / Global';
}

/**
 * Determine if an opportunity is remote/online.
 */
function isRemote(op) {
  const text = ((op.title || '') + ' ' + (op.snippet || '') + ' ' + (op.location || '')).toLowerCase();
  return text.includes('remote') || text.includes('online') || text.includes('virtual') || text.includes('anywhere');
}

/**
 * Determine if an opportunity matches a given location string.
 */
function matchesLocation(op, locationStr) {
  if (!locationStr) return true;
  const text = ((op.title || '') + ' ' + (op.snippet || '') + ' ' + (op.location || '')).toLowerCase();
  const loc = locationStr.toLowerCase();
  // Match city, region, or country
  return text.includes(loc);
}

/**
 * Deterministic shuffle using a string seed.
 * Ensures different users / refreshes see a different ordering.
 */
function seededShuffle(arr, seed) {
  const result = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    h = ((h * 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Search providers with automatic failover ─────────────────────────────────

async function trySerp(q, start = 0) {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&gl=cm&hl=en&num=10&start=${start}&api_key=${SERP_API_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) {
      console.warn(`[SERP] HTTP ${r.status} — switching to Serper`);
      return null;
    }
    const d = await r.json();
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

async function trySerper(q, start = 0) {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, gl: 'cm', hl: 'en', num: 10, start }),
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

async function fetchFromSearch(tag, educationLevel = '', age = 0, start = 0) {
  const ed = educationLevel ? educationLevel.toLowerCase() : '';
  const ageQuery = age > 0 ? `for ${age} year olds` : '';
  const queries = [
    `${tag} ${ed} scholarships internships for African students 2026`,
    `${tag} opportunities Cameroon ${ed} 2026`,
    `${tag} fully-funded ${ed} program Africa 2026 ${ageQuery}`,
  ];
  const all = [];
  for (const q of queries) {
    let results = await trySerp(q, start);
    if (!results) {
      console.log(`[Search] SerpAPI failed for "${q}", trying Serper…`);
      results = await trySerper(q, start);
    }
    if (!results) console.log(`[Search] Both APIs failed for "${q}", using static library.`);
    if (results) all.push(...results);
  }
  return all;
}

// ── Auto-ensure static seed exists ───────────────────────────────────────────
async function ensureSeeded() {
  if (seeded) return;
  try {
    const { count } = await supabase.from('lp_tag_cache').select('id', { count: 'exact', head: true });
    if (!count || count === 0) {
      console.log('[Seed] Cache empty — seeding static library…');
      await seedOpportunities();
    }
  } catch (e) {
    console.warn('[Seed] ensureSeeded check failed:', e.message);
  }
  seeded = true;
}

// ── Background live-search cache refresh (fire-and-forget, never blocks response) ──
function triggerBackgroundRefresh(tags, educationLevel, age) {
  if (!SERPER_KEY && !SERP_API_KEY) return;
  setImmediate(async () => {
    for (const tag of tags.slice(0, 3)) { // limit to top 3 tags to keep it sane
      try {
        const rawResults = await fetchFromSearch(tag, educationLevel, age, 0);
        if (!rawResults.length) continue;
        const now = new Date();
        const { data: cacheRow } = await supabase.from('lp_tag_cache').select('results').eq('tag', tag).maybeSingle();
        let existing = [];
        try { existing = JSON.parse(cacheRow?.results || '[]'); } catch {}
        const staticResults = existing.filter(o => o.id?.startsWith('static-'));
        const liveMapped = rawResults.filter(r => r.link && r.title).map(r => {
          const hash = Buffer.from(r.link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
          return {
            id: `live-${tag}-${hash}`,
            title: r.title, link: r.link, snippet: r.snippet, description: r.snippet,
            source: r.source, tag, category: detectCategory(r.title, r.snippet),
            deadline: extractDeadline(r.snippet), eligibility: extractEligibility(r.snippet),
            benefits: extractBenefits(r.snippet), location: extractLocation(r.snippet),
            amount: extractAmount(r.title + ' ' + r.snippet),
            degree_level: extractDegreeLevel(r.title + ' ' + r.snippet),
            country_focus: extractCountryFocus(r.title + ' ' + r.snippet),
            verified: false,
          };
        }).filter(op => isSpecificOpportunity(op));
        const merged = filterOpportunities([...staticResults, ...liveMapped]);
        await supabase.from('lp_tag_cache').upsert(
          { tag, results: JSON.stringify(merged), cached_at: now.toISOString() },
          { onConflict: 'tag' }
        );
        console.log(`[BG Refresh] Updated cache for tag: ${tag} (${liveMapped.length} live results)`);
      } catch (e) {
        console.warn(`[BG Refresh] Failed for tag ${tag}:`, e.message);
      }
    }
  });
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
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized', details: err.message });
    }

    // ── Parallel fetch: user profile + user settings + verified opps + seed check ──
    const [
      { data: user },
      { data: userExtra },
    ] = await Promise.all([
      supabase.from('lp_users').select('interests, education_level, age, location, region').eq('id', decoded.userId).single(),
      supabase.from('lp_user_extra').select('settings').eq('user_id', decoded.userId).single(),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userSettings = userExtra?.settings || {};

    // Ensure static seed exists (fast — only runs once per cold start)
    await ensureSeeded();

    const interests = JSON.parse(user.interests || '[]');
    const {
      page = 1,
      category = 'all',
      tag: reqTag,
      refresh,
      search,
      location_mode,
      user_location,
      nonce = ''
    } = req.query;

    const forceRefresh = refresh === '1' || refresh === 'true';
    const pageNum  = parseInt(page) || 1;
    const pageSize = parseInt(req.query.limit) || 25;

    const effectiveLocationMode = location_mode || userSettings.location_mode || 'all';
    const effectiveUserLocation = user_location || userSettings.user_location || user.location || user.region || '';

    const normalizedInterests = interests.flatMap(i => {
      const s = String(i).toLowerCase().trim();
      const slug = s.replace(/[^a-z0-9]+/g, '_');
      const words = s.split(/[^a-z0-9]+/);
      return [i, slug, ...words];
    }).filter(Boolean);

    // Always query 'featured' tag cache as well as normalized interests & core tags
    const queryTags = Array.from(new Set([
      'featured',
      'general',
      'all',
      ...(reqTag ? [reqTag, reqTag.toLowerCase().replace(/[^a-z0-9]+/g, '_')] : normalizedInterests),
      'technology', 'entrepreneurship', 'leadership', 'data_science', 'stem', 'international_relations', 'research', 'medicine', 'education', 'business'
    ]));

    const effectiveTags = reqTag ? [reqTag] : (normalizedInterests.length ? normalizedInterests : ['featured']);

    const now = new Date();
    const cacheExpiry = new Date(now.getTime() - CACHE_HOURS * 60 * 60 * 1000);

    // ── Parallel fetch: ALL tag cache rows + verified posts in ONE round-trip ─
    const [
      { data: allCacheRows },
      { data: verifiedPosts },
    ] = await Promise.all([
      supabase.from('lp_tag_cache').select('tag, results, cached_at').in('tag', queryTags),
      supabase.from('lp_verified_opps').select('*').eq('verified', true).order('created_at', { ascending: false }).limit(60),
    ]);

    let allOpps = [];

    // ── Community-verified opportunities ──────────────────────────────────────
    for (const v of verifiedPosts || []) {
      if (reqTag && v.tag && v.tag !== reqTag) continue;
      allOpps.push({
        id: `verified-${v.id}`,
        title: v.title,
        link: v.link,
        snippet: v.description,
        description: v.description,
        source: v.source || v.user_name || 'Community',
        tag: v.tag || 'general',
        category: v.category,
        deadline: v.deadline,
        eligibility: v.eligibility,
        benefits: v.benefits,
        location: v.location,
        verified: true,
        upvotes: v.upvotes,
      });
    }

    // ── Process all returned cache rows ───────────────────────────────────────
    let needsLiveRefresh = false;

    for (const row of allCacheRows || []) {
      let cachedResults = [];
      try { cachedResults = JSON.parse(row.results || '[]'); } catch {}

      const cacheIsFresh = !forceRefresh && new Date(row.cached_at) >= cacheExpiry;
      if (!cacheIsFresh && effectiveTags.includes(row.tag)) needsLiveRefresh = true;

      // Serve from cache immediately (static + previous live results)
      const tagResults = filterOpportunities(cachedResults);

      // Filter out expired deadlines
      const active = tagResults.filter(op => {
        if (!op.deadline) return true;
        try {
          const d = new Date(op.deadline);
          return isNaN(d.getTime()) || d >= now;
        } catch { return true; }
      });

      // Personalization scoring
      const scored = active.map(op => {
        let score = op.featured ? 500 : 0;
        const text = (op.title + ' ' + (op.snippet || '')).toLowerCase();
        if (text.includes('cameroon') || text.includes('cmr')) score += 100;
        if (text.includes('africa')) score += 30;
        interests.forEach(interest => {
          if (text.includes(interest.toLowerCase())) score += 20;
        });
        return { ...op, _score: score };
      });

      // Filter noise
      const clean = scored.filter(op => {
        const t = (op.title + ' ' + (op.snippet || '')).toLowerCase();
        const noise = ['privacy policy', 'terms of service', 'login', 'signup', 'forgot password', 'cookies', '404 not found'];
        return !noise.some(n => t.includes(n));
      });

      allOpps.push(...clean);
    }

    // ── Trigger background live search refresh (non-blocking) ─────────────────
    if (needsLiveRefresh || forceRefresh) {
      triggerBackgroundRefresh(effectiveTags, user.education_level, user.age);
    }

    // ── Age & education filters ────────────────────────────────────────────────
    const userAge = parseInt(user.age) || 0;
    const userEd  = (user.education_level || '').toLowerCase();
    
    const filtered = allOpps.filter(op => {
      // Always include top 25 curated featured opportunities
      if (op.featured) return true;

      const text = ((op.title||'') + ' ' + (op.snippet||'') + ' ' + (op.eligibility||'')).toLowerCase();
      
      if (userAge > 0) {
        const m = text.match(/age[d]?\s*(\d+)\s*[-–to]+\s*(\d+)/i);
        if (m && (userAge < parseInt(m[1]) || userAge > parseInt(m[2]))) return false;
      }

      if (userEd) {
        if (userEd.includes('high school')) {
          if (text.includes('phd') || text.includes('graduate student') || text.includes('masters degree')) return false;
        }
        if (userEd.includes('undergraduate') || userEd.includes('bachelor')) {
          if (text.includes('phd') || text.includes('postdoc')) return false;
        }
      }

      return true;
    });

    // ── Location filter ───────────────────────────────────────────────────────
    let locationFiltered = filtered;
    if (effectiveLocationMode === 'remote') {
      locationFiltered = filtered.filter(op => {
        const text = ((op.title||'') + ' ' + (op.snippet||'') + ' ' + (op.location||'')).toLowerCase();
        return text.includes('remote') || text.includes('online') || text.includes('virtual')
          || text.includes('anywhere') || text.includes('global') || text.includes('worldwide')
          || text.includes('international') || !op.location;
      });
    } else if (effectiveLocationMode === 'onsite' && effectiveUserLocation) {
      locationFiltered = filtered.filter(op => {
        const text = ((op.title||'') + ' ' + (op.snippet||'') + ' ' + (op.location||'')).toLowerCase();
        const loc = effectiveUserLocation.toLowerCase();
        return text.includes(loc) || text.includes('global') || text.includes('worldwide')
          || text.includes('international') || text.includes('all countries') || !op.location;
      });
    }

    const unique = filterOpportunities(locationFiltered);

    // ── Prioritize Featured Top 25, then shuffle unverified ──────────────────
    const verifiedOpps   = unique.filter(op => op.verified);
    const unverifiedOpps = unique.filter(op => !op.verified);

    // Sort verified opportunities: featured_rank (1..25) first in rank order
    const sortedVerified = [...verifiedOpps].sort((a, b) => {
      const rankA = a.featured_rank != null ? a.featured_rank : (a.featured ? 50 : 999);
      const rankB = b.featured_rank != null ? b.featured_rank : (b.featured ? 50 : 999);
      if (rankA !== rankB) return rankA - rankB;
      return (b._score || 0) - (a._score || 0);
    });

    const shuffleSeed    = `${nonce}-${decoded.userId}-p${pageNum}`;
    const shuffled       = [...sortedVerified, ...seededShuffle(unverifiedOpps, shuffleSeed)];

    // ── Search filter ─────────────────────────────────────────────────────────
    let searched = shuffled;
    if (search && search.trim()) {
      const q = search.toLowerCase();
      searched = shuffled.filter(op => 
        (op.title || '').toLowerCase().includes(q) || 
        (op.snippet || '').toLowerCase().includes(q) || 
        (op.eligibility || '').toLowerCase().includes(q) ||
        (op.description || '').toLowerCase().includes(q)
      );
    }

    // ── Category filter ───────────────────────────────────────────────────────
    const catFiltered = category === 'all' ? searched : searched.filter(op => op.category === category);

    // ── Pagination ────────────────────────────────────────────────────────────
    const start = (pageNum - 1) * pageSize;
    const pageItems = catFiltered.slice(start, start + pageSize);

    const hasMore = start + pageSize < catFiltered.length;

    return res.status(200).json({
      items: pageItems,
      total: catFiltered.length,
      hasMore,
      page: pageNum,
      location_mode: effectiveLocationMode,
      sources: { cached: true, refreshing: needsLiveRefresh || forceRefresh },
    });

  } catch (err) {
    console.error('Opportunities error:', err);
    res.status(500).json({ error: err.message });
  }
}

