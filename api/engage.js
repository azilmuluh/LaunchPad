import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const body = req.method === 'POST' ? req.body : {};
    const query = req.method === 'GET' ? req.query : {};
    const { action, item_id, item_type, content, parent_id } = { ...query, ...body };

    console.log(`[Engage] Action: ${action}, Item: ${item_id}, Type: ${item_type}, Method: ${req.method}`);

    if (!item_id || !item_type) {
       // Allow action='comment' without item_id if it's a GET for all comments? No, usually scoped.
    }

    // 1. HANDLE LIKES (UPVOTES)
    if (action === 'like') {
      if (req.method === 'POST') {
        // Toggle like
        const { data: existing } = await supabase
          .from('lp_engagement_likes')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .maybeSingle();

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item_id);

        if (existing) {
          await supabase.from('lp_engagement_likes').delete().eq('id', existing.id);
          if (item_type === 'blip' && isUUID) {
            await supabase.rpc('decrement_blip_likes', { blip_id: item_id });
          }
          return res.status(200).json({ liked: false });
        } else {
          await supabase.from('lp_engagement_likes').insert({ user_id: userId, item_id, item_type });
          if (item_type === 'blip' && isUUID) {
            await supabase.rpc('increment_blip_likes', { blip_id: item_id });
          }
          return res.status(200).json({ liked: true });
        }
      }
      
      if (req.method === 'GET') {
        const { count } = await supabase
          .from('lp_engagement_likes')
          .select('id', { count: 'exact', head: true })
          .eq('item_id', item_id)
          .eq('item_type', item_type);
          
        const { data: userLiked } = await supabase
          .from('lp_engagement_likes')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .maybeSingle();

        return res.status(200).json({ count: count || 0, liked: !!userLiked });
      }
    }

    // 2. HANDLE COMMENTS
    if (action === 'comment') {
      if (req.method === 'POST') {
        const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item_id);

        const { data: comment, error } = await supabase
          .from('lp_engagement_comments')
          .insert({
            user_id: userId,
            user_name: user?.full_name || 'Anonymous',
            item_id,
            item_type,
            content,
            parent_id
          })
          .select()
          .single();

        if (error) throw error;

        if (item_type === 'blip' && isUUID) {
          await supabase.rpc('increment_blip_comments', { blip_id: item_id });
        }

        // Update user streak stats & XP
        const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
        const XP_COMMENT = 10;
        if (st) {
          const newXP = (st.total_xp || 0) + XP_COMMENT;
          await supabase.from('lp_streaks').update({
            total_xp: newXP,
            level: Math.floor(newXP / 500) + 1,
            comments_made: (st.comments_made || 0) + 1,
            last_seen: new Date().toISOString()
          }).eq('user_id', userId);
        } else {
          await supabase.from('lp_streaks').insert({
            user_id: userId,
            total_xp: XP_COMMENT,
            level: 1,
            comments_made: 1,
            last_seen: new Date().toISOString()
          });
        }

        // Log XP action
        await supabase.from('lp_xp_log').insert({ user_id: userId, action: 'comment', xp: XP_COMMENT });

        return res.status(200).json(comment);
      }

      if (req.method === 'GET') {
        const { item_id, item_type } = req.query;
        const { data: comments, error } = await supabase
          .from('lp_engagement_comments')
          .select('*')
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return res.status(200).json(comments);
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Engagement API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
