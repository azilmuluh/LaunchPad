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

    const { image_base64, image_text } = req.body;
    if (!image_base64 && !image_text) return res.status(400).json({ error: 'Image data required' });

    // Use a vision model if image is provided
    const model = image_base64 ? 'meta/llama-3.2-11b-vision-instruct' : 'meta/llama-3.1-8b-instruct';
    
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract the following fields from this opportunity flyer and return ONLY a valid JSON object. Do NOT nest the JSON. Use EXACTLY these lowercase keys:
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

Return ONLY the raw JSON object. No explanation, no markdown blocks, no backticks.`
          }
        ]
      }
    ];

    if (image_base64) {
      messages[0].content.push({
        type: 'image_url',
        image_url: { url: image_base64 }
      });
    } else {
      messages[0].content[0].text += `\n\nFlyer content:\n${image_text}`;
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
    if (!NVIDIA_KEY) throw new Error("NVIDIA_API_KEY is not configured.");
    const openai = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    
    // Improved JSON extraction
    let parsed = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedRaw = JSON.parse(jsonMatch[0]);
        // Normalize keys to lowercase to prevent mapping issues
        for (const [key, value] of Object.entries(parsedRaw)) {
          parsed[key.toLowerCase().trim()] = value;
        }
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseErr) {
      console.error('JSON Parse failed. Raw content:', raw);
      throw new Error('Could not parse AI response as JSON');
    }

    // Validate category
    const validCats = ['scholarship', 'internship', 'competition', 'event', 'job', 'grant'];
    if (parsed.category && !validCats.includes(parsed.category)) {
      parsed.category = 'opportunity';
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Flyer parse error:', err);
    res.status(500).json({ error: err.message });
  }
}
