import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { action, item_id } = req.query;

    if (req.method === 'GET') {
      if (action === 'get_counts') {
        const { data, error } = await supabase
          .from('lp_opportunity_stats')
          .select('*')
          .in('item_id', item_id.split(','));
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    if (req.method === 'POST') {
      if (action === 'track_apply') {
        const { item_id } = req.body;
        if (!item_id) return res.status(400).json({ error: 'item_id required' });

        // Upsert stats
        const { data: existing } = await supabase.from('lp_opportunity_stats').select('*').eq('item_id', item_id).maybeSingle();
        if (existing) {
          await supabase.from('lp_opportunity_stats').update({ 
            apply_count: (existing.apply_count || 0) + 1,
            last_applied_at: new Date().toISOString()
          }).eq('item_id', item_id);
        } else {
          await supabase.from('lp_opportunity_stats').insert({ 
            item_id, apply_count: 1, last_applied_at: new Date().toISOString()
          });
        }

        // Optional: track who applied
        await supabase.from('lp_applications').insert({ user_id: userId, item_id });

        return res.status(200).json({ ok: true });
      }
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Social Proof error:', err);
    res.status(500).json({ error: err.message });
  }
}
