import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

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
    jwt.verify(token, JWT_SECRET);

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

IMPORTANT: At the very end of your response, provide a strictly formatted JSON block enclosed in <roadmap_json> tags. This JSON should be an array of strings representing the key actionable steps (max 10 steps).
Example:
<roadmap_json>["Review eligibility", "Gather documents", "Draft personal statement", "Submit application"]</roadmap_json>

Be specific and actionable.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
    if (!NVIDIA_KEY) throw new Error("NVIDIA_API_KEY is not configured.");
    const openai = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

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
    res.end();
  } catch (err) {
    console.error('AI Roadmap error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end(); }
  }
}
