import supabase from './_supabase.js';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File upload error' });
    const file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    let text = '';
    try {
      if (file.mimetype === 'application/pdf') {
        const data = fs.readFileSync(file.filepath);
        const parsed = await pdfParse(data);
        text = parsed.text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const data = fs.readFileSync(file.filepath);
        const result = await mammoth.extractRawText({ buffer: data });
        text = result.value;
      } else if (file.mimetype === 'text/plain') {
        text = fs.readFileSync(file.filepath, 'utf8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
      res.status(200).json({ text });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse file', details: e.message });
    }
  });
}
