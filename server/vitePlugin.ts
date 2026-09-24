import type { Plugin } from 'vite';
import { generateMaleUSVoice } from './voiceService.ts';

export function voiceApiVitePlugin(): Plugin {
  return {
    name: 'voice-api-vite-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle CORS / preflight if needed
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.url?.startsWith('/api/health') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: 'ok',
              hasGeminiKey: !!process.env.GEMINI_API_KEY,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (req.url?.startsWith('/api/generate-voice') && req.method === 'POST') {
          let bodyChunks: Buffer[] = [];
          req.on('data', (chunk) => {
            bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });

          req.on('end', async () => {
            try {
              const bodyStr = Buffer.concat(bodyChunks).toString('utf-8');
              const body = JSON.parse(bodyStr || '{}');

              if (!body.text || !body.text.trim()) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Text prompt is required.' }));
                return;
              }

              const result = await generateMaleUSVoice({
                text: body.text,
                voiceName: body.voiceName,
                style: body.style,
                speed: body.speed,
              });

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (error: any) {
              console.error('Error handling /api/generate-voice in Vite plugin:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: error?.message || 'Failed to synthesize speech.',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}
