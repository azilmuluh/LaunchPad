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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const me = uid(req);

    if (req.method === 'GET') {
      const { mode = 'network', user_id } = req.query;

      if (mode === 'profile' && user_id) {
        const { data: u } = await supabase.from('lp_users').select('id,full_name,education_level,location,interests,created_at').eq('id', user_id).single();
        const { data: ex } = await supabase.from('lp_user_extra').select('avatar_url').eq('user_id', user_id).maybeSingle();
        const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', user_id).maybeSingle();
        const { data: posts } = await supabase.from('lp_posts').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(5);
        const { data: badges } = await supabase.from('lp_badges').select('badge_key,earned_at').eq('user_id', user_id);
        return res.status(200).json({ user: u, extra: ex || {}, stats: st || {}, posts: posts || [], badges: badges || [] });
      }

      if (mode === 'suggestions' && me) {
        const { data: myUser } = await supabase.from('lp_users').select('interests').eq('id', me).single();
        const myInterests = JSON.parse(myUser?.interests || '[]');
        const { data: conns } = await supabase.from('lp_connections').select('requester_id,addressee_id').or(`requester_id.eq.${me},addressee_id.eq.${me}`);
        const connectedIds = new Set((conns || []).flatMap(c => [c.requester_id, c.addressee_id]).filter(id => id !== me));
        connectedIds.add(me);
        const { data: users } = await supabase.from('lp_users').select('id,full_name,education_level,location,interests').neq('id', me).limit(50);
        const { data: extras } = await supabase.from('lp_user_extra').select('user_id,avatar_url');
        const extraMap = Object.fromEntries((extras || []).map(e => [e.user_id, e]));
        const scored = (users || [])
          .filter(u => !connectedIds.has(u.id))
          .map(u => { const overlap = JSON.parse(u.interests || '[]').filter(i => myInterests.includes(i)).length; return { ...u, avatar_url: extraMap[u.id]?.avatar_url || null, overlap }; })
          .sort((a, b) => b.overlap - a.overlap)
          .slice(0, 20);
        return res.status(200).json(scored);
      }

      if (mode === 'network' && me) {
        const { data: conns } = await supabase.from('lp_connections').select('*').or(`requester_id.eq.${me},addressee_id.eq.${me}`).eq('status', 'accepted');
        const peerIds = (conns || []).map(c => c.requester_id === me ? c.addressee_id : c.requester_id);
        if (!peerIds.length) return res.status(200).json([]);
        const { data: users } = await supabase.from('lp_users').select('id,full_name,education_level,location,interests').in('id', peerIds);
        const { data: extras } = await supabase.from('lp_user_extra').select('user_id,avatar_url').in('user_id', peerIds);
        const extraMap = Object.fromEntries((extras || []).map(e => [e.user_id, e]));
        return res.status(200).json((users || []).map(u => ({ ...u, avatar_url: extraMap[u.id]?.avatar_url || null })));
      }

      if (mode === 'requests' && me) {
        const { data: reqs } = await supabase.from('lp_connections').select('*').eq('addressee_id', me).eq('status', 'pending');
        if (!reqs?.length) return res.status(200).json([]);
        const ids = reqs.map(r => r.requester_id);
        const { data: users } = await supabase.from('lp_users').select('id,full_name').in('id', ids);
        const { data: extras } = await supabase.from('lp_user_extra').select('user_id,avatar_url').in('user_id', ids);
        const extraMap = Object.fromEntries((extras || []).map(e => [e.user_id, e]));
        return res.status(200).json(reqs.map(r => ({ ...r, requester: { ...users?.find(u => u.id === r.requester_id), avatar_url: extraMap[r.requester_id]?.avatar_url || null } })));
      }

      if (mode === 'status' && me) {
        const { other_id } = req.query;
        const { data: conn } = await supabase.from('lp_connections').select('*').or(`and(requester_id.eq.${me},addressee_id.eq.${other_id}),and(requester_id.eq.${other_id},addressee_id.eq.${me})`).maybeSingle();
        return res.status(200).json({ status: conn?.status || null, connection_id: conn?.id || null, is_requester: conn?.requester_id === me });
      }

      return res.status(200).json([]);
    }

    if (!me) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { addressee_id } = req.body;
      const { data: existing } = await supabase.from('lp_connections').select('id,status').or(`and(requester_id.eq.${me},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${me})`).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Connection already exists', status: existing.status });
      const { data, error } = await supabase.from('lp_connections').insert({ requester_id: me, addressee_id, status: 'pending' }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { connection_id, action } = req.body;
      const { data: conn } = await supabase.from('lp_connections').select('*').eq('id', connection_id).single();
      if (!conn || conn.addressee_id !== me) return res.status(403).json({ error: 'Forbidden' });
      if (action === 'accept') {
        await supabase.from('lp_connections').update({ status: 'accepted' }).eq('id', connection_id);
        return res.status(200).json({ status: 'accepted' });
      }
      await supabase.from('lp_connections').delete().eq('id', connection_id);
      return res.status(200).json({ status: 'rejected' });
    }

    if (req.method === 'DELETE') {
      const { other_id } = req.body;
      await supabase.from('lp_connections').delete().or(`and(requester_id.eq.${me},addressee_id.eq.${other_id}),and(requester_id.eq.${other_id},addressee_id.eq.${me})`);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Connections error:', err);
    res.status(500).json({ error: err.message });
  }
}
