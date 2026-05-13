import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import supabase from './_supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;

const CACHE_KEY = 'ai_feedback_cache_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const refresh = String(req.query?.refresh || '').toLowerCase() === '1' || String(req.query?.refresh || '').toLowerCase() === 'true';

    // Load settings cache
    const { data: extra } = await supabase.from('lp_user_extra').select('settings').eq('user_id', userId).maybeSingle();
    const settings = extra?.settings || {};
    const cached = settings?.[CACHE_KEY];
    const cachedAt = cached?.ts ? new Date(cached.ts).getTime() : 0;
    if (!refresh && cached?.data && cachedAt && (Date.now() - cachedAt) < CACHE_TTL_MS) {
      return res.status(200).json({ ...cached.data, cached: true });
    }

    const [{ data: user }, { data: st }, { data: goals }] = await Promise.all([
      supabase.from('lp_users').select('full_name,interests,education_level,location').eq('id', userId).single(),
      supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('lp_goals').select('id,title,category,target_date,status,progress').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);

    const interests = user?.interests ? JSON.parse(user.interests || '[]').slice(0, 8) : [];
    const activeGoals = (goals || []).filter((g) => g.status === 'active').slice(0, 5);

    const prompt = `You are LaunchPad AI. Generate personalized "app engagement feedback" to help the user get more value from LaunchPad.

User:
- Name: ${user?.full_name || 'User'}
- Education: ${user?.education_level || 'unknown'}
- Location: ${user?.location || 'unknown'}
- Interests: ${interests.join(', ') || 'general'}

Engagement stats:
- total_xp: ${st?.total_xp || 0}
- level: ${st?.level || 1}
- current_streak_days: ${st?.current_streak || 0}
- opps_posted: ${st?.opps_posted || 0}
- opps_bookmarked: ${st?.opps_bookmarked || 0}
- comments_made: ${st?.comments_made || 0}
- posts_made: ${st?.posts_made || 0}

Active goals (if any):
${activeGoals.length ? activeGoals.map((g) => `- ${g.title} (${g.category}, progress ${g.progress || 0}%)`).join('\n') : '- none'}

Return ONLY strict JSON:
{
  "summary": "1-2 sentence summary",
  "tips": [
    { "title": "short title", "why": "1 sentence", "next_step": "a concrete action in the app", "route": "/feed|/community|/ai|/profile|/bookmarks|/leaderboard|/post" }
  ]
}
Rules:
- 4 to 6 tips.
- Tips must reference existing LaunchPad areas: Feed, Community, Bookmarks, Goals, AI, Leaderboard.
- Be specific and actionable.`;

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
    if (!NVIDIA_KEY) throw new Error('NVIDIA_API_KEY is not configured.');
    const openai = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 700,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: '', tips: [] };

    // Save cache in settings (best-effort)
    try {
      const newSettings = { ...settings, [CACHE_KEY]: { ts: new Date().toISOString(), data: parsed } };
      await supabase.from('lp_user_extra').update({ settings: newSettings, updated_at: new Date().toISOString() }).eq('user_id', userId);
    } catch {}

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('AI feedback error:', err);
    return res.status(500).json({ error: err.message });
  }
}

