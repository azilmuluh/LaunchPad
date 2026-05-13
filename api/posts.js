import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const INTEREST_TO_CATEGORY = {
  technology: ['tip', 'opportunity', 'win'],
  software_dev: ['tip', 'opportunity', 'win'],
  data_science: ['tip', 'opportunity', 'win'],
  cybersecurity: ['tip', 'opportunity'],
  engineering: ['tip', 'opportunity', 'win'],
  medicine: ['tip', 'opportunity', 'win'],
  health: ['tip', 'opportunity'],
  public_health: ['opportunity'],
  arts: ['win', 'thought', 'opportunity'],
  music: ['win', 'thought'],
  film: ['win', 'thought'],
  performing_arts: ['win', 'thought'],
  graphic_design: ['win', 'thought', 'tip'],
  business: ['tip', 'opportunity', 'win'],
  entrepreneurship: ['tip', 'opportunity', 'win'],
  finance: ['tip', 'opportunity'],
  law: ['tip', 'opportunity'],
  education: ['tip', 'opportunity', 'win'],
  leadership: ['win', 'thought', 'tip'],
  sports: ['win', 'thought'],
  media: ['win', 'tip', 'opportunity'],
  journalism: ['win', 'tip'],
  research: ['tip', 'opportunity'],
  environment: ['opportunity', 'thought'],
  agriculture: ['opportunity', 'tip'],
  social_sciences: ['thought', 'opportunity'],
  social_work: ['thought', 'opportunity'],
  human_rights: ['thought', 'opportunity'],
};

function getUserId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET).userId; } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const action = req.query.action || req.body.action;

    if (req.method === 'GET' && !action) {
      const { page = 1, limit = 10, interests: interestParam } = req.query;
      const pageNum = parseInt(page);
      const pageSize = parseInt(limit);
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize - 1;

      const userId = getUserId(req);

      let query = supabase.from('lp_posts').select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      // Personalized feed: filter by categories matching user interests
      if (interestParam && interestParam.trim()) {
        const interests = interestParam.split(',').map(s => s.trim()).filter(Boolean);
        const relevantCategories = new Set();
        interests.forEach(int => {
          const cats = INTEREST_TO_CATEGORY[int];
          if (cats) cats.forEach(c => relevantCategories.add(c));
        });
        if (relevantCategories.size > 0) {
          // Include posts that match OR posts with no category (general)
          const catList = [...relevantCategories];
          query = query.or(`category.in.(${catList.join(',')}),category.is.null`);
        }
      }

      const { data: posts, error, count } = await query;
      if (error) throw error;

      // Fetch avatars for all authors
      const authorIds = [...new Set(posts.map(p => p.user_id))];
      const { data: extras } = await supabase.from('lp_user_extra').select('user_id, avatar_url').in('user_id', authorIds);
      const avatarMap = {};
      extras?.forEach(e => { avatarMap[e.user_id] = e.avatar_url; });

      // Get liked post IDs for current user
      let likedIds = new Set();
      if (userId) {
        const { data: likes } = await supabase.from('lp_post_likes')
          .select('post_id').eq('user_id', userId);
        if (likes) likedIds = new Set(likes.map(l => l.post_id));
      }

      const enriched = (posts || []).map(p => ({ 
        ...p, 
        liked_by_me: likedIds.has(p.id),
        user_avatar: avatarMap[p.user_id] || null
      }));

      return res.status(200).json({
        posts: enriched,
        total: count || 0,
        hasMore: end + 1 < (count || 0),
        page: pageNum,
      });
    }

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { content, opportunity_link, opportunity_title, category } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

      const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { data: post, error } = await supabase.from('lp_posts').insert({
        user_id: userId,
        user_name: user.full_name,
        content: content.trim(),
        opportunity_link: opportunity_link || null,
        opportunity_title: opportunity_title || null,
        category: category || null,
      }).select().single();
      if (error) throw error;

      // Log XP action (used by quests/analytics)
      try {
        await supabase.from('lp_xp_log').insert({ user_id: userId, action: 'community_post', xp: 20 });
      } catch {}

      // Award XP
      try {
        const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
        const newXP = (st?.total_xp || 0) + 20;
        if (st) await supabase.from('lp_streaks').update({ total_xp: newXP, level: Math.floor(newXP / 500) + 1, posts_made: (st.posts_made || 0) + 1 }).eq('user_id', userId);
        else await supabase.from('lp_streaks').insert({ user_id: userId, total_xp: 20, level: 1, current_streak: 1, longest_streak: 1, posts_made: 1 });
      } catch {}

      return res.status(201).json({ ...post, liked_by_me: false });
    }

    if (req.method === 'DELETE' || action === 'delete') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Post ID required' });
      const { data: post } = await supabase.from('lp_posts').select('user_id').eq('id', id).single();
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('lp_posts').delete().eq('id', id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'cleanup') {
      // Auto-delete posts where deadline is passed
      const now = new Date().toISOString();
      const { error } = await supabase.from('lp_posts')
        .delete()
        .not('deadline', 'is', null)
        .lt('deadline', now);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Posts error:', err);
    res.status(500).json({ error: err.message });
  }
}
