import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMaleUSVoice } from './server/voiceService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Voice generation endpoint
app.post('/api/generate-voice', async (req, res) => {
  try {
    const { text, voiceName, style, speed } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const result = await generateMaleUSVoice({
      text,
      voiceName,
      style,
      speed,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-voice:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate voice speech.',
    });
  }
});

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Voice Studio server listening on http://0.0.0.0:${PORT}`);
});
