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

    // 1. HANDLE LIKES (UPVOTES)
    if (action === 'like') {
      if (req.method === 'POST') {
        // Validate required fields
        if (!item_id || !item_type) {
          return res.status(400).json({ error: 'Missing required fields: item_id, item_type' });
        }

        // Toggle like
        const { data: existing, error: fetchError } = await supabase
          .from('lp_engagement_likes')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .maybeSingle();

        if (fetchError) {
          console.error('[Engage] Like fetch error:', fetchError);
          return res.status(500).json({ error: 'Failed to check like status' });
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item_id);

        if (existing) {
          const { error: deleteError } = await supabase.from('lp_engagement_likes').delete().eq('id', existing.id);
          if (deleteError) {
            console.error('[Engage] Like delete error:', deleteError);
            return res.status(500).json({ error: 'Failed to remove like' });
          }
          
          if (item_type === 'blip' && isUUID) {
            try {
              await supabase.rpc('decrement_blip_likes', { blip_id: item_id });
            } catch (e) {
              console.error('[Engage] Failed to decrement blip likes:', e);
            }
          }
          return res.status(200).json({ liked: false });
        } else {
          const { error: insertError } = await supabase.from('lp_engagement_likes').insert({ user_id: userId, item_id, item_type });
          if (insertError) {
            console.error('[Engage] Like insert error:', insertError);
            return res.status(500).json({ error: 'Failed to add like' });
          }
          
          if (item_type === 'blip' && isUUID) {
            try {
              await supabase.rpc('increment_blip_likes', { blip_id: item_id });
            } catch (e) {
              console.error('[Engage] Failed to increment blip likes:', e);
            }
          }
          return res.status(200).json({ liked: true });
        }
      }
      
      if (req.method === 'GET') {
        if (!item_id || !item_type) {
          return res.status(400).json({ error: 'Missing required fields: item_id, item_type' });
        }

        const { count, error: countError } = await supabase
          .from('lp_engagement_likes')
          .select('id', { count: 'exact', head: true })
          .eq('item_id', item_id)
          .eq('item_type', item_type);

        if (countError) {
          console.error('[Engage] Like count error:', countError);
          return res.status(500).json({ error: 'Failed to fetch like count' });
        }
          
        const { data: userLiked, error: userLikeError } = await supabase
          .from('lp_engagement_likes')
          .select('id')
          .eq('user_id', userId)
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .maybeSingle();

        if (userLikeError) {
          console.error('[Engage] User like check error:', userLikeError);
          return res.status(500).json({ error: 'Failed to check user like' });
        }

        return res.status(200).json({ count: count || 0, liked: !!userLiked });
      }
    }

    // 2. HANDLE COMMENTS
    if (action === 'comment') {
      if (req.method === 'POST') {
        // Validate required fields
        if (!item_id || !item_type || !content) {
          return res.status(400).json({ error: 'Missing required fields: item_id, item_type, content' });
        }

        const { data: user, error: userError } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
        if (userError) {
          console.error('[Engage] User fetch error:', userError);
          return res.status(500).json({ error: 'Failed to fetch user info' });
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item_id);

        const { data: comment, error: commentError } = await supabase
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

        if (commentError) {
          console.error('[Engage] Comment insert error:', commentError);
          return res.status(500).json({ error: 'Failed to create comment' });
        }

        // Increment blip comment count if applicable
        if (item_type === 'blip' && isUUID) {
          try {
            await supabase.rpc('increment_blip_comments', { blip_id: item_id });
          } catch (e) {
            console.error('[Engage] Failed to increment blip comments:', e);
            // Non-critical, continue
          }
        }

        // Update user streak stats & XP (wrap in try-catch to ensure comment was created)
        try {
          const { data: st, error: streakError } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
          if (streakError) throw streakError;

          const XP_COMMENT = 10;
          if (st) {
            const newXP = (st.total_xp || 0) + XP_COMMENT;
            const { error: updateError } = await supabase.from('lp_streaks').update({
              total_xp: newXP,
              level: Math.floor(newXP / 500) + 1,
              comments_made: (st.comments_made || 0) + 1,
              last_seen: new Date().toISOString()
            }).eq('user_id', userId);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase.from('lp_streaks').insert({
              user_id: userId,
              total_xp: XP_COMMENT,
              level: 1,
              comments_made: 1,
              last_seen: new Date().toISOString()
            });
            if (insertError) throw insertError;
          }

          // Log XP action
          const { error: logError } = await supabase.from('lp_xp_log').insert({ user_id: userId, action: 'comment', xp: XP_COMMENT });
          if (logError) {
            console.error('[Engage] XP log error:', logError);
            // Non-critical
          }
        } catch (xpError) {
          console.error('[Engage] XP update failed:', xpError);
          // XP update failed, but comment was created - return the comment anyway
        }

        return res.status(200).json(comment);
      }

      if (req.method === 'GET') {
        if (!item_id || !item_type) {
          return res.status(400).json({ error: 'Missing required fields: item_id, item_type' });
        }

        const { data: comments, error } = await supabase
          .from('lp_engagement_comments')
          .select('*')
          .eq('item_id', item_id)
          .eq('item_type', item_type)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[Engage] Comment fetch error:', error);
          return res.status(500).json({ error: 'Failed to fetch comments' });
        }
        return res.status(200).json(comments || []);
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Engagement API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
