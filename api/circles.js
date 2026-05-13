import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import { checkAndAwardBadges } from './badges.js';

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

  const userId = uid(req);

  try {
    const action = req.query.action || req.body.action;

    // List all circles
    if (req.method === 'GET' && !action) {
      const { data, error } = await supabase
        .from('lp_circles_v2').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      let memberOf = new Set();
      if (userId) {
        const { data: mem } = await supabase.from('lp_circle_members_v2')
          .select('circle_id').eq('user_id', userId);
        if (mem) mem.forEach(m => memberOf.add(m.circle_id));
      }
      const ids = (data || []).map(c => c.id);
      let countMap = {};
      if (ids.length) {
        const { data: counts } = await supabase.from('lp_circle_members_v2')
          .select('circle_id').in('circle_id', ids);
        (counts || []).forEach(c => { countMap[c.circle_id] = (countMap[c.circle_id] || 0) + 1; });
      }
      const circles = (data || []).map(c => ({ ...c, is_member: memberOf.has(c.id), member_count: countMap[c.id] || 0 }));
      return res.status(200).json({ circles, member_of: [...memberOf] });
    }

    // Get single circle with all data
    if (req.method === 'GET' && action === 'get') {
      const { id } = req.query;
      const { data: circle } = await supabase.from('lp_circles_v2').select('*').eq('id', id).single();
      if (!circle) return res.status(404).json({ error: 'Circle not found' });

      const [{ data: members }, { data: tasks }, { data: resources }] = await Promise.all([
        supabase.from('lp_circle_members_v2').select('*').eq('circle_id', id).order('joined_at'),
        supabase.from('lp_circle_tasks').select('*').eq('circle_id', id).order('created_at', { ascending: false }),
        supabase.from('lp_circle_resources').select('*').eq('circle_id', id).order('created_at', { ascending: false }),
      ]);

      // Fetch avatars for members
      const memberIds = (members || []).map(m => m.user_id);
      const { data: extras } = await supabase.from('lp_user_extra').select('user_id, avatar_url').in('user_id', memberIds);
      const avatarMap = {};
      extras?.forEach(e => { avatarMap[e.user_id] = e.avatar_url; });

      const enrichedMembers = (members || []).map(m => ({ ...m, avatar_url: avatarMap[m.user_id] || null }));

      const isMember = userId ? (members || []).some(m => m.user_id === userId) : false;
      const isCreator = userId ? circle.creator_id === userId : false;

      let myCompletions = [];
      if (userId) {
        const { data: comps } = await supabase.from('lp_circle_task_completions')
          .select('task_id').eq('user_id', userId);
        myCompletions = (comps || []).map(c => c.task_id);
      }

      return res.status(200).json({
        circle, members: enrichedMembers, tasks: tasks || [],
        resources: resources || [], isMember, isCreator, myCompletions,
      });
    }

    // Get circle messages
    if (req.method === 'GET' && action === 'messages') {
      const { circle_id } = req.query;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { data: mem } = await supabase.from('lp_circle_members_v2')
        .select('id').eq('circle_id', circle_id).eq('user_id', userId).maybeSingle();
      if (!mem) return res.status(403).json({ error: 'Not a member' });
      const { data: msgs } = await supabase.from('lp_circle_messages')
        .select('*').eq('circle_id', circle_id).order('created_at').limit(200);
      
      const senderIds = [...new Set((msgs || []).map(m => m.user_id))];
      const { data: extras } = await supabase.from('lp_user_extra').select('user_id, avatar_url').in('user_id', senderIds);
      const avatarMap = {};
      extras?.forEach(e => { avatarMap[e.user_id] = e.avatar_url; });

      const enriched = (msgs || []).map(m => ({ ...m, user_avatar: avatarMap[m.user_id] || null }));
      return res.status(200).json(enriched);
    }

    // Require auth for mutations
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Create circle
    if (req.method === 'POST' && !action) {
      const { name, description, goal, category, emoji, is_private, rules } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

      const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      const { data: circle, error } = await supabase.from('lp_circles_v2').insert({
        name: name.trim(),
        description: description?.trim() || null,
        goal: goal?.trim() || null,
        category: category || null,
        emoji: emoji || '👥',
        creator_id: userId,
        creator_name: user?.full_name || 'Unknown',
        is_private: is_private || false,
        rules: rules?.trim() || null,
      }).select().single();
      if (error) throw error;

      // Creator auto-joins as admin
      await supabase.from('lp_circle_members_v2').insert({
        circle_id: circle.id, user_id: userId,
        user_name: user?.full_name, role: 'creator',
        rules_accepted: true,
      });

      await awardXP(userId, 30, 'create_circle');
      return res.status(201).json({ ...circle, is_member: true, member_count: 1 });
    }

    // Join circle
    if (req.method === 'POST' && action === 'join') {
      const { circle_id, rules_accepted } = req.body;

      const { data: circle } = await supabase.from('lp_circles_v2').select('rules').eq('id', circle_id).single();
      if (circle?.rules && !rules_accepted) {
        return res.status(400).json({ error: 'Must accept circle rules to join', requires_rules: true, rules: circle.rules });
      }

      const { data: existing } = await supabase.from('lp_circle_members_v2')
        .select('id').eq('circle_id', circle_id).eq('user_id', userId).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Already a member' });

      const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      const { error: joinErr } = await supabase.from('lp_circle_members_v2').insert({
        circle_id, user_id: userId, user_name: user?.full_name,
        role: 'member', rules_accepted: true,
      });
      if (joinErr) throw joinErr;

      await awardXP(userId, 5, 'join_circle');
      return res.status(200).json({ ok: true });
    }

    // Send message
    if (req.method === 'POST' && action === 'message') {
      const { circle_id, content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

      const { data: mem } = await supabase.from('lp_circle_members_v2')
        .select('id').eq('circle_id', circle_id).eq('user_id', userId).maybeSingle();
      if (!mem) return res.status(403).json({ error: 'Not a member' });

      const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      const { data, error } = await supabase.from('lp_circle_messages').insert({
        circle_id, user_id: userId, user_name: user?.full_name, content: content.trim(),
      }).select().single();
      if (error) throw error;
      await awardXP(userId, 2, 'circle_message');
      return res.status(201).json(data);
    }

    // Add task (creator only)
    if (req.method === 'POST' && action === 'task') {
      const { circle_id, title, description, due_date, xp_reward } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'Title required' });

      const { data: circle } = await supabase.from('lp_circles_v2').select('creator_id').eq('id', circle_id).single();
      if (circle?.creator_id !== userId) return res.status(403).json({ error: 'Only creator can add tasks' });

      const { data, error } = await supabase.from('lp_circle_tasks').insert({
        circle_id, title: title.trim(),
        description: description?.trim() || null,
        due_date: due_date || null,
        xp_reward: xp_reward || 20,
        created_by: userId,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // Complete task
    if (req.method === 'POST' && action === 'complete-task') {
      const { task_id, circle_id } = req.body;

      const { data: mem } = await supabase.from('lp_circle_members_v2')
        .select('id').eq('circle_id', circle_id).eq('user_id', userId).maybeSingle();
      if (!mem) return res.status(403).json({ error: 'Not a member' });

      const { data: existing } = await supabase.from('lp_circle_task_completions')
        .select('id').eq('task_id', task_id).eq('user_id', userId).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Already completed' });

      const { data: task } = await supabase.from('lp_circle_tasks').select('xp_reward').eq('id', task_id).single();
      await supabase.from('lp_circle_task_completions').insert({ task_id, user_id: userId, circle_id });
      await awardXP(userId, task?.xp_reward || 20, 'complete_task');
      return res.status(200).json({ ok: true });
    }

    // Add resource
    if (req.method === 'POST' && action === 'resource') {
      const { circle_id, title, url, description, type } = req.body;
      if (!title?.trim() || !url?.trim()) return res.status(400).json({ error: 'Title and URL required' });

      const { data: mem } = await supabase.from('lp_circle_members_v2')
        .select('id').eq('circle_id', circle_id).eq('user_id', userId).maybeSingle();
      if (!mem) return res.status(403).json({ error: 'Not a member' });

      const { data: user } = await supabase.from('lp_users').select('full_name').eq('id', userId).single();
      const { data, error } = await supabase.from('lp_circle_resources').insert({
        circle_id, title: title.trim(), url: url.trim(),
        description: description?.trim() || null,
        type: type || 'link',
        uploaded_by: userId, uploaded_by_name: user?.full_name,
      }).select().single();
      if (error) throw error;
      await awardXP(userId, 10, 'add_resource');
      return res.status(201).json(data);
    }

    // Kick member (creator only)
    if (req.method === 'DELETE' && action === 'kick') {
      const { circle_id, target_user_id } = req.body;
      const { data: circle } = await supabase.from('lp_circles_v2').select('creator_id').eq('id', circle_id).single();
      if (circle?.creator_id !== userId) return res.status(403).json({ error: 'Only creator can kick members' });
      await supabase.from('lp_circle_members_v2').delete().eq('circle_id', circle_id).eq('user_id', target_user_id);
      return res.status(200).json({ ok: true });
    }

    // Leave circle
    if (req.method === 'DELETE' && action === 'leave') {
      const { circle_id } = req.body;
      await supabase.from('lp_circle_members_v2').delete().eq('circle_id', circle_id).eq('user_id', userId);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Circles error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function awardXP(userId, amount, action) {
  try {
    const { data: st } = await supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle();
    const newXP = (st?.total_xp || 0) + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    if (st) {
      await supabase.from('lp_streaks').update({ total_xp: newXP, level: newLevel }).eq('user_id', userId);
    } else {
      await supabase.from('lp_streaks').insert({ user_id: userId, total_xp: amount, level: 1, current_streak: 1, longest_streak: 1 });
    }
    await supabase.from('lp_xp_log').insert({ user_id: userId, action, xp: amount });
    
    // Check for new badges
    const { data: user } = await supabase.from('lp_users').select('email, full_name').eq('id', userId).single();
    checkAndAwardBadges(userId, user?.email, user?.full_name).catch(() => {});
  } catch {}
}
