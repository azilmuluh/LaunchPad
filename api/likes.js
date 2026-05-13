import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (req.method === 'POST') {
      const { post_id } = req.body;
      if (!post_id) return res.status(400).json({ error: 'post_id required' });

      const { data: existing } = await supabase.from('lp_post_likes').select('id').eq('post_id', post_id).eq('user_id', userId).maybeSingle();

      if (existing) {
        await supabase.from('lp_post_likes').delete().eq('post_id', post_id).eq('user_id', userId);
        const { data: cur } = await supabase.from('lp_posts').select('likes_count').eq('id', post_id).single();
        const newCount = Math.max(0, (cur?.likes_count || 1) - 1);
        await supabase.from('lp_posts').update({ likes_count: newCount }).eq('id', post_id);
        return res.status(200).json({ liked: false, likes_count: newCount });
      } else {
        await supabase.from('lp_post_likes').insert({ post_id, user_id: userId });
        const { data: cur } = await supabase.from('lp_posts').select('likes_count').eq('id', post_id).single();
        const newCount = (cur?.likes_count || 0) + 1;
        await supabase.from('lp_posts').update({ likes_count: newCount }).eq('id', post_id);
        return res.status(200).json({ liked: true, likes_count: newCount });
      }
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Likes error:', err);
    res.status(500).json({ error: err.message });
  }
}
