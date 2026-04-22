import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2026';

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET).userId; } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action } = req.query;
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // ── BOOKMARKS ───────────────────────────────────────────────────────────
    if (action === 'bookmarks') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('lp_bookmarks_v2').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }

      if (req.method === 'POST') {
        const { title, link, snippet, description, source, category, tag, deadline, location, eligibility, benefits, folder, notes } = req.body;
        if (!link) return res.status(400).json({ error: 'Link required' });

        const { data: existing } = await supabase.from('lp_bookmarks_v2').select('id').eq('user_id', userId).eq('link', link).maybeSingle();
        if (existing) return res.status(409).json({ error: 'Already bookmarked' });

        const { data, error } = await supabase.from('lp_bookmarks_v2').insert({
          user_id: userId, title, link,
          snippet: snippet || description || null,
          description: description || snippet || null,
          source, category, tag, deadline,
          location: location || null,
          eligibility: eligibility || null,
          benefits: benefits || null,
          folder: folder || 'general',
          notes: notes || null,
        }).select().single();
        if (error) throw error;

        try {
          const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
          const newXP = (st?.total_xp || 0) + 5;
          if (st) await supabase.from('lp_streaks').update({ total_xp: newXP, level: Math.floor(newXP / 500) + 1, opps_bookmarked: (st.opps_bookmarked || 0) + 1 }).eq('user_id', userId);
          else await supabase.from('lp_streaks').insert({ user_id: userId, total_xp: 5, level: 1, current_streak: 1, longest_streak: 1, opps_bookmarked: 1 });
        } catch {}

        return res.status(201).json(data);
      }

      if (req.method === 'PUT') {
        const { link, applied, notes, folder } = req.body;
        if (!link) return res.status(400).json({ error: 'Link required' });
        const updates = {};
        if (applied !== undefined) { updates.applied = applied; if (applied) updates.applied_at = new Date().toISOString(); }
        if (notes !== undefined) updates.notes = notes;
        if (folder !== undefined) updates.folder = folder;
        const { data, error } = await supabase.from('lp_bookmarks_v2').update(updates).eq('user_id', userId).eq('link', link).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      if (req.method === 'DELETE') {
        const { link } = req.body;
        const { error } = await supabase.from('lp_bookmarks_v2').delete().eq('user_id', userId).eq('link', link);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }
    }

    // ── GOALS ───────────────────────────────────────────────────────────────
    if (action === 'goals') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('lp_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }

      if (req.method === 'POST') {
        const { title, description, category, target_date } = req.body;
        if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
        const { data, error } = await supabase.from('lp_goals').insert({
          user_id: userId, title: title.trim(),
          description: description?.trim() || null,
          category: category || 'general',
          target_date: target_date || null,
          milestones: [], progress: 0, status: 'active',
        }).select().single();
        if (error) throw error;

        await supabase.from('lp_xp_log').insert({ user_id: userId, action: 'set_goal', xp: 15 });
        const { data: s } = await supabase.from('lp_streaks').select('total_xp,level,goals_set').eq('user_id', userId).single();
        if (s) {
          const newXP = (s.total_xp || 0) + 15;
          await supabase.from('lp_streaks').update({ total_xp: newXP, level: Math.floor(newXP / 500) + 1, goals_set: (s.goals_set || 0) + 1 }).eq('user_id', userId);
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
    }

    res.status(400).json({ error: 'Invalid action. Use ?action=bookmarks|goals' });
  } catch (err) {
    console.error('Engage error:', err);
    res.status(500).json({ error: err.message });
  }
}
