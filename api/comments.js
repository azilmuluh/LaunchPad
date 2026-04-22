import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { checkAndAwardBadges } from './badges.js';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2026';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { post_id } = req.query;
      if (!post_id) return res.status(400).json({ error: 'post_id required' });
      const { data, error } = await supabase.from('lp_comments').select('*').eq('post_id', post_id).order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (req.method === 'POST') {
      const { post_id, content } = req.body;
      if (!post_id || !content?.trim()) return res.status(400).json({ error: 'post_id and content required' });

      const { data: user } = await supabase.from('lp_users').select('full_name, email').eq('id', userId).single();
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { data: comment, error } = await supabase.from('lp_comments').insert({
        post_id, user_id: userId, user_name: user.full_name, content: content.trim(),
      }).select().single();
      if (error) throw error;

      // Increment comment count
      const { data: p } = await supabase.from('lp_posts').select('comments_count').eq('id', post_id).single();
      await supabase.from('lp_posts').update({ comments_count: (p?.comments_count || 0) + 1 }).eq('id', post_id);

      // Badge check async
      checkAndAwardBadges(userId, user.email, user.full_name).catch(() => {});

      return res.status(201).json(comment);
    }

    if (req.method === 'DELETE') {
      const { id, post_id } = req.body;
      const { data: comment } = await supabase.from('lp_comments').select('user_id').eq('id', id).single();
      if (!comment || comment.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
      await supabase.from('lp_comments').delete().eq('id', id);
      const { data: p } = await supabase.from('lp_posts').select('comments_count').eq('id', post_id).single();
      await supabase.from('lp_posts').update({ comments_count: Math.max(0, (p?.comments_count || 1) - 1) }).eq('id', post_id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Comments error:', err);
    res.status(500).json({ error: err.message });
  }
}
