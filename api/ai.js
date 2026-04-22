import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import supabase from './_supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2026';
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.query;

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET);

    // ── CHAT (was /api/ai-chat) ─────────────────────────────────────────────
    if (action === 'chat') {
      const { message, context, imageBase64, goals } = req.body;
      if (!message?.trim() && !imageBase64) return res.status(400).json({ error: 'Message required' });

      const { data: user } = await supabase.from('lp_users').select('full_name,interests,education_level,age,location').eq('id', decoded.userId).single();
      const { data: extra } = await supabase.from('lp_user_extra').select('cv_text').eq('user_id', decoded.userId).single();

      const interests = user ? JSON.parse(user.interests || '[]').slice(0, 8).join(', ') : '';
      const goalContext = goals?.length ? `\n\nUSER GOALS: ${goals.map(g => `"${g.title}" (${g.category}, target: ${g.target_date || 'open'})`).join('; ')}` : '';
      const cvContext = extra?.cv_text ? `\n\nUSER CV SUMMARY (first 500 chars): ${extra.cv_text.slice(0, 500)}` : '';

      const systemPrompt = `You are LaunchPad AI, an expert career and opportunities advisor for African youth, especially Cameroonians. You are a proactive, intelligent companion — not just reactive.

User profile:
- Name: ${user?.full_name || 'User'}
- Education: ${user?.education_level || 'unknown'}
- Location: ${user?.location || 'Cameroon'}
- Age: ${user?.age || 'unknown'}
- Interests: ${interests || 'general'}${goalContext}${cvContext}

Your capabilities:
1. Find scholarships, internships, competitions, events, and jobs (especially for Cameroon/Africa, 2026)
2. Help craft essays, CVs, cover letters, and applications
3. Break down goals into structured action plans with deadlines
4. Provide interview and competition preparation
5. Analyze uploaded documents or images the user shares
6. Track progress toward goals and suggest next steps
7. Recommend relevant community Circles and Spaces
8. Surface deadlines and eligibility requirements proactively

Always be specific, practical, warm, and encouraging. Use bullet points for lists. Tailor everything to the user's profile and goals. For 2026 opportunities, reference real programs like IYMC, ICSC, MasterCard Foundation, DAAD, Chevening, TEF, etc.`;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const userContent = imageBase64
        ? [{ type: 'text', text: message || 'Please analyze this image/document.' }, { type: 'image_url', image_url: { url: imageBase64 } }]
        : message;

      const stream = await openai.chat.completions.create({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'system', content: systemPrompt }, ...(context || []), { role: 'user', content: userContent }],
        temperature: 0.7, max_tokens: 1500, stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // ── ROADMAP (was /api/ai-roadmap) ───────────────────────────────────────
    if (action === 'roadmap') {
      const { opportunity, userProfile } = req.body;
      if (!opportunity?.title) return res.status(400).json({ error: 'Opportunity data required' });

      const prompt = `You are an expert career advisor. Create a detailed, personalized step-by-step roadmap for this opportunity:

Opportunity: ${opportunity.title}
Type: ${opportunity.category}
Deadline: ${opportunity.deadline || 'Not specified'}
Eligibility: ${opportunity.eligibility || 'Not specified'}
Benefits: ${opportunity.benefits || 'Not specified'}
Description: ${opportunity.description || opportunity.snippet || ''}

User Profile:
- Education: ${userProfile?.education_level || 'Not specified'}
- Age: ${userProfile?.age || 'Not specified'}
- Location: ${userProfile?.location || 'Not specified'}
- Interests: ${userProfile?.interests ? JSON.parse(userProfile.interests || '[]').slice(0, 5).join(', ') : 'Not specified'}

Provide:
## Eligibility Check
## Timeline & Key Dates
## Step-by-Step Application Roadmap (numbered)
## Documents & Materials Needed
## Tips to Stand Out
## Common Mistakes to Avoid

Be specific and actionable.`;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await openai.chat.completions.create({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, max_tokens: 2048, stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // ── FLYER PARSE (was /api/flyer-parse) ─────────────────────────────────
    if (action === 'flyer') {
      const { image_base64, image_text } = req.body;
      if (!image_base64 && !image_text) return res.status(400).json({ error: 'Image data required' });

      const prompt = `You are an AI assistant that extracts structured opportunity data from flyer images or text.

Extract the following fields from this opportunity flyer and return ONLY a valid JSON object:
{
  "title": "Full opportunity title",
  "category": "scholarship|internship|competition|event|job|grant",
  "source": "Organization/Institution name",
  "location": "Location or Online",
  "deadline": "Application deadline date as text",
  "link": "Application URL if visible",
  "description": "Clear 2-3 sentence description of the opportunity",
  "eligibility": "Eligibility criteria separated by bullet (•)",
  "benefits": "Benefits/prizes separated by bullet (•)",
  "tag": "One of: technology|business|medicine|engineering|law|education|arts|agriculture|finance|entrepreneurship|data_science|research|health|social_sciences|media|environment|leadership|sports"
}

Flyer content:
${image_text || '[Image provided - extract all visible text and structured data]'}

Return ONLY the JSON object, no explanation.`;

      const completion = await openai.chat.completions.create({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, max_tokens: 800,
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      const validCats = ['scholarship', 'internship', 'competition', 'event', 'job', 'grant'];
      if (!validCats.includes(parsed.category)) parsed.category = 'opportunity';

      return res.status(200).json(parsed);
    }

    res.status(400).json({ error: 'Invalid action. Use ?action=chat|roadmap|flyer' });
  } catch (err) {
    console.error('AI error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end(); }
  }
}
