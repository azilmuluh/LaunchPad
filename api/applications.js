import supabase from './_supabase.js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || '';

async function saveApplication(row, existing) {
  const payload = {
    status: row.status,
    opportunity: row.opportunity,
    checklist: row.checklist,
    ai_plan: row.ai_plan,
    updated_at: row.updated_at,
  };
  const run = async (body) => {
    if (existing?.id) {
      return supabase.from('lp_applications').update(body).eq('id', existing.id).select().single();
    }
    return supabase.from('lp_applications').insert({ user_id: row.user_id, item_id: row.item_id, ...body }).select().single();
  };
  let { data, error } = await run(payload);
  if (error) {
    const minimal = { updated_at: row.updated_at };
    ({ data, error } = await run(minimal));
  }
  if (error) throw error;
  return { ...data, opportunity: data.opportunity || row.opportunity, checklist: data.checklist || row.checklist, ai_plan: data.ai_plan || row.ai_plan, status: data.status || row.status };
}

function uid(req) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t) return null;
  try { return jwt.verify(t, JWT_SECRET || 'fallback-secret-for-dev').userId; } catch { return null; }
}

const DEFAULT_CHECKLIST = (opp) => [
  { text: 'Confirm eligibility requirements', done: false },
  { text: 'Gather CV/resume and transcripts', done: false },
  { text: 'Draft personal statement or motivation letter', done: false },
  { text: 'Request recommendation letters (if required)', done: false },
  { text: `Submit before deadline: ${opp.deadline || 'check official site'}`, done: false },
];

async function generateAIPlan(opportunity, user) {
  const interests = (() => {
    try { return JSON.parse(user.interests || '[]').slice(0, 6).join(', '); } catch { return ''; }
  })();

  const prompt = `You are LaunchPad AI helping an African youth prepare ONE specific application.

Opportunity: ${opportunity.title}
Category: ${opportunity.category || 'opportunity'}
Official link: ${opportunity.link || 'N/A'}
Deadline: ${opportunity.deadline || 'Not specified'}
Eligibility: ${opportunity.eligibility || opportunity.description || 'See official site'}
Benefits: ${opportunity.benefits || 'Not specified'}

Applicant: ${user.full_name || 'Student'}, education: ${user.education_level || 'N/A'}, location: ${user.location || 'Cameroon'}, interests: ${interests}

Return markdown with:
## Requirements checklist (bullet list of documents & criteria)
## Timeline (week-by-week if deadline known)
## Essay / statement angles (2-3 tailored themes)
## How to stand out
## Red flags to avoid

Be specific to THIS program only — not generic scholarship advice.`;

  if (!NVIDIA_KEY) {
    return `## Prepare your application for ${opportunity.title}\n\n1. Read the official page carefully.\n2. List required documents.\n3. Draft your statement linking your goals to this program.\n4. Submit before ${opportunity.deadline || 'the stated deadline'}.`;
  }

  const client = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });
  const completion = await client.chat.completions.create({
    model: 'meta/llama-3.1-8b-instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens: 1200,
  });
  return completion.choices[0]?.message?.content || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: user } = await supabase
      .from('lp_users')
      .select('full_name, interests, education_level, location, age')
      .eq('id', userId)
      .single();

    if (req.method === 'GET') {
      const { item_id } = req.query;

      if (item_id) {
        const { data, error } = await supabase
          .from('lp_applications')
          .select('*')
          .eq('user_id', userId)
          .eq('item_id', item_id)
          .maybeSingle();
        if (error) throw error;

        const { count: applyCount } = await supabase
          .from('lp_applications')
          .select('id', { count: 'exact', head: true })
          .eq('item_id', item_id);

        return res.status(200).json({
          application: data || null,
          community_applications: applyCount || 0,
        });
      }

      const { data, error } = await supabase
        .from('lp_applications')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ applications: data || [] });
    }

    if (req.method === 'POST') {
      const { action, opportunity, item_id, checklist, status, toggle_index } = req.body;
      if (!item_id && !opportunity?.id) {
        return res.status(400).json({ error: 'item_id or opportunity required' });
      }
      const oppId = item_id || opportunity.id;
      const snapshot = opportunity || {};

      const { data: existing } = await supabase
        .from('lp_applications')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', oppId)
        .maybeSingle();

      if (action === 'generate_plan') {
        const plan = await generateAIPlan(snapshot, user || {});
        const row = {
          user_id: userId,
          item_id: oppId,
          status: existing?.status || 'in_progress',
          opportunity: snapshot,
          checklist: existing?.checklist || DEFAULT_CHECKLIST(snapshot),
          ai_plan: plan,
          updated_at: new Date().toISOString(),
        };
        const saved = await saveApplication(row, existing);
        return res.status(200).json(saved);
      }

      // Create or open workspace
      let checklistData = checklist || existing?.checklist || DEFAULT_CHECKLIST(snapshot);
      if (typeof toggle_index === 'number' && Array.isArray(checklistData)) {
        checklistData = checklistData.map((c, i) =>
          i === toggle_index ? { ...c, done: !c.done } : c
        );
      }

      const row = {
        user_id: userId,
        item_id: oppId,
        status: status || existing?.status || 'draft',
        opportunity: snapshot,
        checklist: checklistData,
        ai_plan: existing?.ai_plan || null,
        updated_at: new Date().toISOString(),
      };

      const saved = await saveApplication(row, existing);
      return res.status(200).json(saved);
    }

    if (req.method === 'PUT') {
      const { item_id, checklist, status, ai_plan } = req.body;
      if (!item_id) return res.status(400).json({ error: 'item_id required' });
      const updates = { updated_at: new Date().toISOString() };
      if (checklist) updates.checklist = checklist;
      if (status) updates.status = status;
      if (ai_plan !== undefined) updates.ai_plan = ai_plan;

      const { data, error } = await supabase
        .from('lp_applications')
        .update(updates)
        .eq('user_id', userId)
        .eq('item_id', item_id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Applications]', err);
    res.status(500).json({ error: err.message });
  }
}
