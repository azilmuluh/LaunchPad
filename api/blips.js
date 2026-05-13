import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const SERP_KEY   = process.env.SERPAPI_KEY || "be4d5e463f3ae6680eeb493f7ebbe4609cc4ef957a8884b2ad84b726b57f13a8";

async function fetchFromYouTube(interest, page = 1) {
  try {
    // Add some random terms for variety
    const varietyTerms = ['latest', 'new', '2026', 'exclusive', 'urgent', 'hot'];
    const randomTerm = varietyTerms[Math.floor(Math.random() * varietyTerms.length)];
    const q = `${interest} ${randomTerm} internships scholarships opportunities for African youth shorts`;
    const offset = (page - 1) * 10;
    const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(q)}&api_key=${SERP_KEY}&start=${offset}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    
    return (d.video_results || []).map((v, i) => {
      const isOpp = v.title.toLowerCase().includes('scholarship') || v.title.toLowerCase().includes('internship') || v.title.toLowerCase().includes('apply');
      return {
        id: `yt-${v.video_id}`,
        type: isOpp ? 'opportunity' : 'info',
        video_source: 'youtube',
        embed_id: v.video_id,
        video_url: v.link,
        title: v.title,
        summary: v.description || v.title,
        tags: [interest, isOpp ? 'opportunity' : 'info', 'Africa'],
        verified: true,
        apply_link: v.link, // For YouTube, we use the video link as a fallback apply link
        likes_count: 0
      };
    });
  } catch (e) {
    console.error('[Blips] YouTube fetch error:', e);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const SEED_DATA = [
    {
      id: 'seed-1',
      type: 'opportunity',
      video_source: 'youtube',
      embed_id: '8y8y1Z0-X_M',
      video_url: 'https://www.youtube.com/shorts/8y8y1Z0-X_M',
      title: 'Mastercard Foundation Scholars Program 2026',
      summary: 'A fully-funded scholarship for African students to study at world-class universities. Applications are now open for the 2026 academic year. This program covers tuition, living expenses, and travel.',
      tags: ['scholarship', 'Africa', 'fully-funded'],
      apply_link: 'https://mastercardfdn.org/all/scholars/',
      deadline: 'August 31, 2026',
      eligibility: 'African students under 35',
      verified: true,
      likes_count: 1240
    },
    {
      id: 'seed-2',
      type: 'info',
      video_source: 'youtube',
      embed_id: 'dQw4w9WgXcQ',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'How to Write a Winning CV for Internships',
      summary: 'Expert tips on tailoring your CV for top-tier tech internships in Africa. Learn what recruiters from Google, Microsoft, and Jumia look for in a candidate.',
      tags: ['career', 'tips', 'cv'],
      verified: true,
      likes_count: 890
    },
    {
      id: 'seed-3',
      type: 'opportunity',
      video_source: 'youtube',
      embed_id: 'SqcY0GlETPk',
      video_url: 'https://www.youtube.com/shorts/SqcY0GlETPk',
      title: 'React Native Internship 2026 - Remote Africa',
      summary: 'Join a leading African fintech startup as a React Native intern. Work on real-world projects and get mentored by senior engineers.',
      tags: ['internship', 'tech', 'remote'],
      apply_link: 'https://launchpad.africa/internships',
      verified: true,
      likes_count: 450
    }
  ];

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(200).json(SEED_DATA);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET || 'fallback-secret-for-dev');
    } catch (e) { return res.status(200).json(SEED_DATA); }

    if (req.method === 'GET') {
      const { page = 1 } = req.query;
      let interest = 'technology';
      try {
        const { data: user } = await supabase.from('lp_users').select('interests').eq('id', decoded.userId).single();
        if (user && user.interests) {
          const parsed = typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests;
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Pick a random interest from the list for more variety on each page load
            interest = parsed[Math.floor(Math.random() * parsed.length)];
          }
        }
      } catch (e) { }

      let blips = [];
      if (page == 1) {
        const { data: dbBlips } = await supabase
          .from('lp_blips')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        blips = dbBlips || [];
      }

      // Fetch live blips
      const liveBlips = await fetchFromYouTube(interest, page);
      blips = [...blips, ...liveBlips];

      if (blips.length === 0 && page == 1) blips = SEED_DATA;

      // Enrich with like status and true counts
      const ids = blips.map(b => b.id);
      const { data: myLikes } = await supabase
        .from('lp_engagement_likes')
        .select('item_id')
        .eq('user_id', decoded.userId)
        .in('item_id', ids);

      const { data: allCounts } = await supabase
        .from('lp_engagement_likes')
        .select('item_id')
        .in('item_id', ids);

      const myLikeSet = new Set(myLikes?.map(l => l.item_id));
      const countMap = {};
      allCounts?.forEach(l => {
        countMap[l.item_id] = (countMap[l.item_id] || 0) + 1;
      });

      const enriched = blips.map(b => ({
        ...b,
        liked: myLikeSet.has(b.id),
        likes_count: (b.likes_count || 0) + (countMap[b.id] || 0)
      }));

      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const { title, summary, video_url, tags, apply_link } = req.body;
      if (!title || !video_url) return res.status(400).json({ error: 'Title and Video URL required' });

      const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', decoded.userId).single();
      const { data: blip, error } = await supabase.from('lp_blips').insert({
        title, summary, video_url,
        tags: tags || [],
        apply_link: apply_link || null,
        creator_id: decoded.userId,
        is_user_generated: true,
        video_source: video_url.includes('youtube') ? 'youtube' : 'direct',
        embed_id: video_url.split('v=')[1] || video_url.split('/').pop(),
        verified: false,
        status: 'published' // Auto-publish for now
      }).select().single();

      if (error) throw error;
      
      // Award XP for posting a blip
      await supabase.from('lp_xp_log').insert({ user_id: decoded.userId, action: 'post_blip', xp: 50 });
      return res.status(201).json(blip);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Blip ID required' });
      if (id.startsWith('yt-') || id.startsWith('seed-')) {
        return res.status(403).json({ error: 'Cannot delete external blips' });
      }
      const { data: blip } = await supabase.from('lp_blips').select('creator_id').eq('id', id).single();
      if (!blip) return res.status(404).json({ error: 'Blip not found' });
      if (blip.creator_id !== decoded.userId) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('lp_blips').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error('Blips API Error:', err);
    return res.status(200).json(SEED_DATA);
  }
}
