import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('lp_goals').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { title, description, category, target_date, milestones } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
      const { data, error } = await supabase.from('lp_goals').insert({
        user_id: userId, title: title.trim(),
        description: description?.trim() || null,
        category: category || 'general',
        target_date: target_date || null,
        milestones: milestones || [], progress: 0, status: 'active',
      }).select().single();
      if (error) throw error;
      // Award XP for setting a goal
      await supabase.from('lp_xp_log').insert({ user_id: userId, action: 'set_goal', xp: 15 });
      const { data: s } = await supabase.from('lp_streaks').select('total_xp,level').eq('user_id', userId).single();
      if (s) {
        const newXP = (s.total_xp || 0) + 15;
        await supabase.from('lp_streaks').update({ total_xp: newXP, level: Math.floor(newXP / 500) + 1 }).eq('user_id', userId);
      }
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, title, description, category, target_date, milestones, progress, status } = req.body;
      const updates = {};
      if (title !== undefined)       updates.title = title;
      if (description !== undefined) updates.description = description;
      if (category !== undefined)    updates.category = category;
      if (target_date !== undefined) updates.target_date = target_date;
      if (milestones !== undefined)  updates.milestones = milestones;
      if (progress !== undefined)    updates.progress = progress;
      if (status !== undefined)      updates.status = status;
      const { data, error } = await supabase.from('lp_goals').update(updates).eq('id', id).eq('user_id', userId).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await supabase.from('lp_goals').delete().eq('id', id).eq('user_id', userId);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Goals error:', err);
    res.status(500).json({ error: err.message });
  }
}
