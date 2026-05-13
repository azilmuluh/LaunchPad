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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const me = uid(req);
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const { with: otherId, mode } = req.query;

      if (mode === 'threads') {
        const { data } = await supabase.from('lp_messages').select('*').or(`sender_id.eq.${me},receiver_id.eq.${me}`).order('created_at', { ascending: false });
        const threads = new Map();
        for (const msg of data || []) {
          const peer = msg.sender_id === me ? msg.receiver_id : msg.sender_id;
          if (!threads.has(peer)) threads.set(peer, msg);
        }
        const peerIds = [...threads.keys()];
        if (!peerIds.length) return res.status(200).json([]);
        const { data: users } = await supabase.from('lp_users').select('id,full_name').in('id', peerIds);
        const { data: extras } = await supabase.from('lp_user_extra').select('user_id,avatar_url').in('user_id', peerIds);
        const uMap = Object.fromEntries((users || []).map(u => [u.id, u]));
        const eMap = Object.fromEntries((extras || []).map(e => [e.user_id, e]));
        // Count unread per thread
        const { data: unread } = await supabase.from('lp_messages').select('sender_id').eq('receiver_id', me).eq('read', false);
        const unreadMap = {};
        for (const m of unread || []) { unreadMap[m.sender_id] = (unreadMap[m.sender_id] || 0) + 1; }
        return res.status(200).json(peerIds.map(pid => ({
          peer_id: pid, peer_name: uMap[pid]?.full_name || 'Unknown',
          peer_avatar: eMap[pid]?.avatar_url || null,
          last_message: threads.get(pid), unread: unreadMap[pid] || 0,
        })));
      }

      if (otherId) {
        // Verify they are connected
        const { data: conn } = await supabase.from('lp_connections').select('status').or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`).maybeSingle();
        // Allow if accepted OR if messages already exist (backward compat)
        const { data } = await supabase.from('lp_messages').select('*').or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`).order('created_at', { ascending: true }).limit(200);
        await supabase.from('lp_messages').update({ read: true }).eq('receiver_id', me).eq('sender_id', otherId);
        return res.status(200).json(data || []);
      }
    }

    if (req.method === 'POST') {
      const { receiver_id, content } = req.body;
      if (!receiver_id || !content) return res.status(400).json({ error: 'receiver_id and content required' });

      // Only allow messaging between connected users
      const { data: conn } = await supabase.from('lp_connections')
        .select('status')
        .or(`and(requester_id.eq.${me},addressee_id.eq.${receiver_id}),and(requester_id.eq.${receiver_id},addressee_id.eq.${me})`)
        .eq('status', 'accepted')
        .maybeSingle();
      if (!conn) return res.status(403).json({ error: 'You can only message connected users' });

      const { data, error } = await supabase.from('lp_messages').insert({ sender_id: me, receiver_id, content }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Messages error:', err);
    res.status(500).json({ error: err.message });
  }
}
