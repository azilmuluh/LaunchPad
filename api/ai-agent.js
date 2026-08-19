import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import supabase from './_supabase.js';
import { sendOneSignalNotification } from './_onesignal.js';

const JWT_SECRET = process.env.JWT_SECRET;

async function fetchWithTimeout(url, { timeoutMs = 12000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal, headers });
  } finally {
    clearTimeout(t);
  }
}

function extractReadableText(html, url) {
  // Pure JavaScript HTML Text Stripper (fully compatible with serverless & edge environments)
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { message, user_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    // Fetch user context for the AI
    const [{ data: user }, { data: extra }, { data: stats }, { data: goals }] = await Promise.all([
      supabase.from('lp_users').select('full_name,interests,education_level,location').eq('id', userId).single(),
      supabase.from('lp_user_extra').select('cv_text').eq('user_id', userId).maybeSingle(),
      supabase.from('lp_streaks').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('lp_goals').select('title,category,status,progress').eq('user_id', userId).limit(5),
    ]);
    
    const cvSnippet = extra?.cv_text ? extra.cv_text.substring(0, 1500) : 'No CV uploaded';

    const userContext = `
User Profile:
- Name: ${user?.full_name || 'Unknown'}
- Interests: ${user?.interests || 'None'}
- Education: ${user?.education_level || 'Unknown'}
- Location: ${user?.location || 'Unknown'}
- CV Content (Snippet): ${cvSnippet}

Engagement Stats:
- Level: ${stats?.level || 1}
- XP: ${stats?.total_xp || 0}
- Current Streak: ${stats?.current_streak || 0}
- Posts made: ${stats?.posts_made || 0}

Current Goals:
${(goals || []).map(g => `- ${g.title} (${g.status}, ${g.progress}% complete)`).join('\n') || 'No active goals'}
`;

    const systemPrompt = `You are LaunchPad Voice Assistant, an intelligent router and personal mentor for the app.
User context: ${userContext}

Analyze the user's input and determine if they want to perform an app action, ask about their progress, or just chat.

Available actions:
1. NAVIGATE: If the user wants to go to a specific page. Valid routes: "/feed", "/blips", "/community", "/network", "/leaderboard", "/post", "/bookmarks", "/profile", "/settings", "/ai".
2. READ_URL: If the user provides a URL (http...) and asks you to read, analyze, or summarize it.
3. CREATE_GOAL: If the user wants you to create a goal (e.g. "create a goal to apply to X", "add goal: ...").
4. CHAT: For general questions, asking about their progress ("How am I doing?", "What are my goals?"), or general chat.

You MUST respond in strict JSON format:
{
  "action": "NAVIGATE" | "READ_URL" | "CREATE_GOAL" | "CHAT",
  "route": "The route if action is NAVIGATE, otherwise null",
  "url": "The extracted URL if action is READ_URL, otherwise null",
  "goal": { "title": "string", "category": "career" | "education" | "skill" | "other", "target_date": "YYYY-MM-DD or null" } | null,
  "message": "A short, friendly verbal response. If they asked about progress, summarize their stats or goals naturally."
}
Do NOT output any markdown blocks or extra text. ONLY the raw JSON object.`;

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
    if (!NVIDIA_KEY) throw new Error("NVIDIA_API_KEY is not configured.");
    
    const openai = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

    let completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      max_tokens: 400,
    });

    let raw = completion.choices[0]?.message?.content || '{}';
    let parsed = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw new Error('No JSON found');
    } catch (err) {
      console.error('Failed to parse AI intent:', raw);
      parsed = { action: 'CHAT', message: 'I heard you, but I had trouble understanding the intent.' };
    }

    // --- PHASE 2: URL READING & GOAL CREATION ---
    if (parsed.action === 'READ_URL' && parsed.url) {
      try {
        const fetchRes = await fetchWithTimeout(parsed.url, {
          timeoutMs: 12000,
          headers: {
            // Some sites require a UA
            'User-Agent': 'Mozilla/5.0 (LaunchPadBot/1.0; +https://launchpad)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        const ct = fetchRes.headers.get('content-type') || '';
        if (!fetchRes.ok) throw new Error(`Fetch failed: ${fetchRes.status}`);
        if (!ct.includes('text/html') && !ct.includes('application/xhtml+xml') && !ct.includes('text/plain')) {
          parsed.message = "I can’t read that link yet (it doesn't look like a normal webpage).";
          return res.status(200).json(parsed);
        }
        const html = await fetchRes.text();
        const textContent = extractReadableText(html, parsed.url).substring(0, 6000);
        
        const goalPrompt = `Based on this webpage content:
"${textContent}"

Generate a personalized action plan / goal for the user to apply to this opportunity or complete this task.
Return ONLY a valid JSON object:
{
  "title": "Short Goal Title",
  "category": "career" | "education" | "skill" | "other",
  "target_date": "YYYY-MM-DD or null",
  "steps": ["Step 1...", "Step 2..."]
}`;

        const goalCompletion = await openai.chat.completions.create({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: goalPrompt }],
          temperature: 0.2,
          max_tokens: 500,
        });

        const goalRaw = goalCompletion.choices[0]?.message?.content || '{}';
        const goalMatch = goalRaw.match(/\{[\s\S]*\}/);
        const goalData = goalMatch ? JSON.parse(goalMatch[0]) : null;

        if (goalData) {
          const { data: created, error: insErr } = await supabase.from('lp_goals').insert({
            user_id: userId,
            title: goalData.title,
            category: goalData.category,
            target_date: goalData.target_date,
            status: 'active',
            progress: 0,
            milestones: (goalData.steps || []).map((s) => ({ title: s, completed: false })),
          }).select('id,title').single();
          if (insErr) throw insErr;
          parsed.message = `I read the link and created a new goal for you: ${goalData.title}!`;
          parsed.result = created ? { type: 'GOAL_CREATED', goal_id: created.id, title: created.title } : null;

          // Push notify (best-effort)
          sendOneSignalNotification({
            headings: 'New AI roadmap ready',
            contents: `Goal created: ${goalData.title}`,
            externalUserIds: [userId],
            userId,
            category: 'ai',
            url: `${process.env.PUBLIC_APP_URL || ''}/profile`,
            data: { type: 'ai_goal_created', title: goalData.title },
          }).catch(() => {});
        } else {
          parsed.message = "I read the link but couldn't generate a specific goal from it.";
        }
      } catch (e) {
        console.error("URL Read Error:", e);
        parsed.message = "I couldn't read that URL. It might be protected, or timed out.";
      }
    }

    if (parsed.action === 'CREATE_GOAL' && parsed.goal?.title) {
      try {
        const title = String(parsed.goal.title || '').trim();
        if (!title) return res.status(200).json({ action: 'CHAT', message: "What's the goal title?" });

        const { data: created, error: insErr } = await supabase.from('lp_goals').insert({
          user_id: userId,
          title,
          description: null,
          category: parsed.goal.category || 'other',
          target_date: parsed.goal.target_date || null,
          milestones: [],
          progress: 0,
          status: 'active',
        }).select('id,title').single();
        if (insErr) throw insErr;
        parsed.message = `Done — I created your goal: ${title}.`;
        parsed.result = created ? { type: 'GOAL_CREATED', goal_id: created.id, title: created.title } : null;
      } catch (e) {
        console.error('CREATE_GOAL error:', e);
        parsed.action = 'CHAT';
        parsed.message = "I couldn't create that goal right now.";
      }
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('AI Agent error:', err);
    res.status(500).json({ error: err.message });
  }
}
