import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const SERP_KEY   = process.env.SERP_API_KEY || process.env.SERPAPI_KEY;

function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : urlOrId;
}

const VERIFIED_BLIPS = [
  {
    id: 'seed-1',
    type: 'opportunity',
    video_source: 'youtube',
    embed_id: '31P3Ha1oLMs',
    video_url: 'https://www.youtube.com/watch?v=31P3Ha1oLMs',
    title: 'Top Fully Funded Scholarships Open Right Now for African Students',
    summary: 'Comprehensive guide to prestigious fully funded international scholarships covering tuition, flights, housing, and monthly living stipends.',
    tags: ['scholarship', 'Africa', 'fully-funded'],
    apply_link: 'https://launchpadcm.netlify.app/feed',
    deadline: '2026/2027 Cycles',
    eligibility: 'Undergraduate & Graduate students',
    verified: true,
    likes_count: 1240
  },
  {
    id: 'seed-2',
    type: 'opportunity',
    video_source: 'youtube',
    embed_id: 'o09Mw9Rb8-Q',
    video_url: 'https://www.youtube.com/watch?v=o09Mw9Rb8-Q',
    title: 'Top Scholarships for African Students (US, UK, Canada)',
    summary: 'Discover major scholarship foundations including Mastercard Foundation, Commonwealth, and DAAD opportunities for African youth.',
    tags: ['scholarship', 'study-abroad', 'global'],
    apply_link: 'https://mcfscholars.ubc.ca',
    deadline: 'Rolling 2026/2027',
    eligibility: 'African nationals under 35',
    verified: true,
    likes_count: 980
  },
  {
    id: 'seed-3',
    type: 'info',
    video_source: 'youtube',
    embed_id: 'eaax5hEvd30',
    video_url: 'https://www.youtube.com/watch?v=eaax5hEvd30',
    title: 'Top Universities in Africa That Offer Full Scholarships',
    summary: 'Explore leading African institutions offering merit-based and need-based tuition waivers, research fellowships, and student grants.',
    tags: ['Africa', 'universities', 'higher-ed'],
    apply_link: 'https://launchpadcm.netlify.app/feed',
    verified: true,
    likes_count: 850
  },
  {
    id: 'seed-4',
    type: 'opportunity',
    video_source: 'youtube',
    embed_id: 'ZAG4709dHB4',
    video_url: 'https://www.youtube.com/watch?v=ZAG4709dHB4',
    title: 'East African & Pan-African Community Scholarships Guide',
    summary: 'Step-by-step application walkthrough for regional postgraduate scholarships and bilateral mobility grants.',
    tags: ['scholarships', 'pan-africa', 'postgraduate'],
    apply_link: 'https://launchpadcm.netlify.app/feed',
    deadline: 'Annual Cohort',
    eligibility: 'African graduates',
    verified: true,
    likes_count: 670
  },
  {
    id: 'seed-5',
    type: 'info',
    video_source: 'youtube',
    embed_id: 'oJ5tnQ18v7o',
    video_url: 'https://www.youtube.com/watch?v=oJ5tnQ18v7o',
    title: 'How to Find & Win International Scholarships — Best Portals',
    summary: 'Proven strategies for drafting standout motivation essays, securing academic recommendations, and building competitive candidate profiles.',
    tags: ['career', 'tips', 'application'],
    apply_link: 'https://launchpadcm.netlify.app/ai',
    verified: true,
    likes_count: 1120
  },
  {
    id: 'seed-6',
    type: 'opportunity',
    video_source: 'youtube',
    embed_id: 'xp4GrEsXN5Y',
    video_url: 'https://www.youtube.com/watch?v=xp4GrEsXN5Y',
    title: 'Mastercard Foundation Scholars Program — How to Apply',
    summary: 'Full walkthrough of applying for the Mastercard Foundation Scholars Program at partner universities across Africa and globally.',
    tags: ['scholarship', 'mastercard', 'Africa'],
    apply_link: 'https://mastercardfdn.org/all/scholars/',
    deadline: 'Varies by partner university',
    eligibility: 'African students with financial need',
    verified: true,
    likes_count: 890
  },
  {
    id: 'seed-7',
    type: 'info',
    video_source: 'youtube',
    embed_id: 'vI9BllmA-iw',
    video_url: 'https://www.youtube.com/watch?v=vI9BllmA-iw',
    title: 'DAAD Scholarships for African Students — Complete Guide',
    summary: 'Everything you need to know about German DAAD scholarships including in-country, regional and Germany programs for African students.',
    tags: ['DAAD', 'Germany', 'scholarship'],
    apply_link: 'https://www.daad.de/en/',
    deadline: 'October–November annually',
    eligibility: 'African graduates and PhD candidates',
    verified: true,
    likes_count: 760
  },
  {
    id: 'seed-8',
    type: 'opportunity',
    video_source: 'youtube',
    embed_id: 'WqEJTDRARRk',
    video_url: 'https://www.youtube.com/watch?v=WqEJTDRARRk',
    title: 'How to Get Into Top Tech Internships as an African Student',
    summary: 'Step-by-step guide to applying for Google, Microsoft, Meta and other tech company internships from Africa.',
    tags: ['internship', 'tech', 'Africa'],
    apply_link: 'https://launchpadcm.netlify.app/feed',
    deadline: 'Rolling applications',
    eligibility: 'University students in CS/STEM',
    verified: true,
    likes_count: 1340
  },
  {
    id: 'seed-9',
    type: 'info',
    video_source: 'youtube',
    embed_id: 'N_6d7PoFHBE',
    video_url: 'https://www.youtube.com/watch?v=N_6d7PoFHBE',
    title: 'Building a Winning Scholarship Application',
    summary: 'Expert tips on crafting compelling personal statements, gathering strong recommendations, and standing out from thousands of applicants.',
    tags: ['tips', 'scholarship', 'application'],
    apply_link: 'https://launchpadcm.netlify.app/ai',
    verified: true,
    likes_count: 920
  },
  {
    id: 'seed-10',
    type: 'opportunity',
    video_source: 'youtube',
    embed_id: 'BwlwQWwXH1Y',
    video_url: 'https://www.youtube.com/watch?v=BwlwQWwXH1Y',
    title: 'Commonwealth Scholarship — Full Application Guide',
    summary: 'Detailed guide to the Commonwealth Scholarship Commission awards for students from developing Commonwealth countries to study in the UK.',
    tags: ['scholarship', 'UK', 'Commonwealth'],
    apply_link: 'https://cscuk.fcdo.gov.uk/apply/',
    deadline: 'December annually',
    eligibility: 'Citizens of developing Commonwealth countries',
    verified: true,
    likes_count: 810
  }
];

const PAGE_SIZE = 8; // blips served per page from seed library


async function fetchFromYouTube(interest, page = 1) {
  if (!SERP_KEY) return [];
  try {
    const searchQueries = [
      `${interest} scholarships opportunities Africa 2026`,
      `fully funded internships scholarships for African students ${interest}`,
      `international youth competitions awards ${interest} 2026`,
      `tech internships career advice African youth ${interest}`
    ];
    const q = searchQueries[(page - 1) % searchQueries.length];
    const offset = (page - 1) * 8;
    const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(q)}&api_key=${SERP_KEY}&start=${offset}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    
    return (d.video_results || []).map((v) => {
      const isOpp = v.title?.toLowerCase().includes('scholarship') || 
                    v.title?.toLowerCase().includes('internship') || 
                    v.title?.toLowerCase().includes('grant') || 
                    v.title?.toLowerCase().includes('apply');
      const videoId = v.video_id || extractYouTubeId(v.link);
      return {
        id: `yt-${videoId}`,
        type: isOpp ? 'opportunity' : 'info',
        video_source: 'youtube',
        embed_id: videoId,
        video_url: v.link || `https://www.youtube.com/watch?v=${videoId}`,
        title: v.title,
        summary: v.description || v.title,
        tags: [interest, isOpp ? 'opportunity' : 'info', 'Africa'],
        verified: true,
        apply_link: v.link || 'https://launchpadcm.netlify.app/feed',
        likes_count: Math.floor(Math.random() * 200) + 50
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

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    let decoded = null;
    if (token) {
      try {
        decoded = jwt.verify(token, JWT_SECRET || 'fallback-secret-for-dev');
      } catch (e) {}
    }

    if (req.method === 'GET') {
      const pageNum = parseInt(req.query.page) || 1;
      let interest = 'technology';
      
      if (decoded?.userId) {
        try {
          const { data: user } = await supabase.from('lp_users').select('interests').eq('id', decoded.userId).single();
          if (user && user.interests) {
            const parsed = typeof user.interests === 'string' ? JSON.parse(user.interests) : user.interests;
            if (Array.isArray(parsed) && parsed.length > 0) {
              interest = parsed[Math.floor(Math.random() * parsed.length)];
            }
          }
        } catch (e) {}
      }

      // Fetch user-generated blips from DB (only those with valid video IDs)
      let dbBlips = [];
      if (pageNum === 1) {
        const { data: rawDbBlips } = await supabase
          .from('lp_blips')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        // Filter to only blips with valid YouTube embed IDs (11-char alphanumeric)
        dbBlips = (rawDbBlips || []).filter(b => {
          const eid = b.embed_id || '';
          return /^[a-zA-Z0-9_-]{11}$/.test(eid);
        });
      }

      // Fetch live blips from YouTube Search
      const liveBlips = await fetchFromYouTube(interest, pageNum);

      // Build blips: page 1 = seed + db + live; subsequent pages = seed slice + live
      let blips = [];
      if (pageNum === 1) {
        blips = [...VERIFIED_BLIPS, ...dbBlips, ...liveBlips];
      } else {
        // Serve next batch of seed blips (cycling) + live results
        const seedStart = ((pageNum - 2) * PAGE_SIZE) % VERIFIED_BLIPS.length;
        const seedSlice = [];
        for (let i = 0; i < PAGE_SIZE; i++) {
          seedSlice.push(VERIFIED_BLIPS[(seedStart + i) % VERIFIED_BLIPS.length]);
        }
        // Deduplicate seed slice IDs to avoid repeating exact same card
        blips = [...liveBlips, ...seedSlice];
      }

      // Deduplicate by embed_id or ID
      const seen = new Set();
      blips = blips.filter(b => {
        const key = b.embed_id || b.video_url || b.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Enrich with like status and true counts
      if (decoded?.userId) {
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

        blips = blips.map(b => ({
          ...b,
          liked: myLikeSet.has(b.id),
          likes_count: (b.likes_count || 0) + (countMap[b.id] || 0)
        }));
      }

      return res.status(200).json({
        blips,
        hasMore: blips.length >= PAGE_SIZE,
        page: pageNum,
      });
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
        video_source: video_url.includes('youtube') || video_url.includes('youtu.be') ? 'youtube' : 'direct',
        embed_id: extractYouTubeId(video_url),
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
    return res.status(200).json({ blips: VERIFIED_BLIPS, hasMore: true, page: 1 });
  }
}
