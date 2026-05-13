import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('lp_bookmarks_v2')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { title, link, snippet, description, source, category, tag, deadline, location, eligibility, benefits } = req.body;
      if (!link) return res.status(400).json({ error: 'Link required' });

      const { data: existing } = await supabase
        .from('lp_bookmarks_v2').select('id').eq('user_id', userId).eq('link', link).single();
      if (existing) return res.status(409).json({ error: 'Already bookmarked' });

      const { data, error } = await supabase.from('lp_bookmarks_v2').insert({
        user_id: userId, title, link,
        snippet: snippet || description || null,
        description: description || snippet || null,
        source, category, tag, deadline,
        location: location || null,
        eligibility: eligibility || null,
        benefits: benefits || null,
      }).select().single();
      if (error) throw error;

      // Log XP action (used by quests/analytics)
      try {
        await supabase.from('lp_xp_log').insert({ user_id: userId, action: 'bookmark', xp: 5 });
      } catch {}

      // Award XP
      try {
        const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
        const newXP = (st?.total_xp || 0) + 5;
        if (st) await supabase.from('lp_streaks').update({ total_xp: newXP, level: Math.floor(newXP / 500) + 1, opps_bookmarked: (st.opps_bookmarked || 0) + 1 }).eq('user_id', userId);
        else await supabase.from('lp_streaks').insert({ user_id: userId, total_xp: 5, level: 1, current_streak: 1, longest_streak: 1, opps_bookmarked: 1 });
      } catch {}

      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { link } = req.body;
      const { error } = await supabase.from('lp_bookmarks_v2').delete().eq('user_id', userId).eq('link', link);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Bookmarks error:', err);
    res.status(500).json({ error: err.message });
  }
}
