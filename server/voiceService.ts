import { GoogleGenAI } from '@google/genai';
import { ensureWav } from './pcmToWav.ts';

export interface GenerateVoiceOptions {
  text: string;
  voiceName?: string;
  style?: string;
  speed?: number;
}

export interface GenerateVoiceResult {
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  durationEstimateSec: number;
  voiceName: string;
  style: string;
}

export async function generateMaleUSVoice(options: GenerateVoiceOptions): Promise<GenerateVoiceResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const {
    text,
    voiceName = 'Fenrir',
    style = 'Natural male US English accent, articulate, clear and resonant studio delivery.',
    speed = 1.0,
  } = options;

  if (!text || !text.trim()) {
    throw new Error('Text to speak cannot be empty.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Compose comprehensive style instruction for Gemini TTS
  const speedDesc = speed > 1.25 ? 'briskly and with upbeat pacing' : speed < 0.85 ? 'deliberately, with measured and calm pacing' : 'at a natural conversational pace';
  const fullStylePrompt = `Male American (US) English accent. ${style}. Deliver speech ${speedDesc}. Studio quality, clear pronunciation, no distortion.`;

  // Use recommended TTS model from Gemini API guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: text.trim(),
            speechMetadata: {
              style: fullStylePrompt,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName,
          },
        },
      },
    },
  });

  const candidate = response.candidates?.[0];
  const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('No audio was returned from speech generation model.');
  }

  const rawBase64 = audioPart.inlineData.data;
  const rawMime = audioPart.inlineData.mimeType || 'audio/pcm;rate=24000';

  // Parse sample rate from mimeType if present (defaults to 24000)
  let sampleRate = 24000;
  const rateMatch = rawMime.match(/rate=(\d+)/i);
  if (rateMatch && rateMatch[1]) {
    sampleRate = parseInt(rateMatch[1], 10);
  }

  // Convert raw PCM or verify WAV header
  const rawBuffer = Buffer.from(rawBase64, 'base64');
  const wavBuffer = ensureWav(rawBuffer, sampleRate);
  const audioBase64 = wavBuffer.toString('base64');

  // Estimate duration: 24000 samples/sec, 1 channel, 16 bits = 48000 bytes/sec
  const pcmBytes = wavBuffer.length - 44;
  const durationEstimateSec = Math.max(0.5, +(pcmBytes / (sampleRate * 2)).toFixed(2));

  return {
    audioBase64,
    mimeType: 'audio/wav',
    sampleRate,
    durationEstimateSec,
    voiceName,
    style: fullStylePrompt,
  };
}
