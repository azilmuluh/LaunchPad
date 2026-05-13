import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import supabase from './_supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;

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

    const { message, context, imageBase64, goals } = req.body;
    if (!message?.trim() && !imageBase64) return res.status(400).json({ error: 'Message required' });

    // Fetch user profile for personalization
    const { data: user } = await supabase.from('lp_users').select('full_name,interests,education_level,age,location').eq('id', decoded.userId).single();
    const { data: extra } = await supabase.from('lp_user_extra').select('cv_text').eq('user_id', decoded.userId).single();

    const interests = user ? JSON.parse(user.interests || '[]').slice(0, 8).join(', ') : '';
    const goalContext = goals?.length
      ? `\n\nUSER GOALS: ${goals.map((g) => `"${g.title}" (${g.category}, target: ${g.target_date || 'open'})`).join('; ')}`
      : '';
    const cvContext = extra?.cv_text ? `\n\nUSER CV CONTENT: ${extra.cv_text.slice(0, 3000)}` : '';

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

    // Build messages — support image attachments
    const userContent = imageBase64
      ? [
          { type: 'text', text: message || 'Please analyze this image/document.' },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ]
      : message;

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
    if (!NVIDIA_KEY) throw new Error("NVIDIA_API_KEY is not configured.");
    const openai = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

    const stream = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(context || []),
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('AI Chat error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end(); }
  }
}
