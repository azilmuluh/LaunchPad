import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2026';
const NVIDIA_KEY = process.env.NVIDIA_API_KEY || '';

const openai = new OpenAI({
  apiKey: NVIDIA_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

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
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate category
    const validCats = ['scholarship', 'internship', 'competition', 'event', 'job', 'grant'];
    if (!validCats.includes(parsed.category)) parsed.category = 'opportunity';

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Flyer parse error:', err);
    res.status(500).json({ error: err.message });
  }
}
