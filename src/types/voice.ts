export interface VoicePersona {
  id: string;
  name: string;
  apiVoiceName: string; // Prebuilt voice name in Gemini TTS (e.g. 'Fenrir', 'Zephyr', 'Puck', 'Charon')
  accent: 'US English';
  gender: 'Male';
  tagline: string;
  description: string;
  recommendedStyles: string[];
  defaultStyle: string;
  avatarColor: string;
  iconName: string;
  badge?: string;
}

export interface DeliveryStyle {
  id: string;
  label: string;
  description: string;
  promptDirective: string;
  icon: string;
}

export interface GenerationHistoryItem {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  styleLabel: string;
  styleDirective: string;
  speed: number;
  durationSec: number;
  audioBase64: string;
  mimeType: string;
  createdAt: number;
  isFavorite?: boolean;
}

export interface SampleScript {
  id: string;
  title: string;
  category: 'Cinematic' | 'Tech' | 'Podcast' | 'Commercial' | 'Story' | 'Mindfulness';
  text: string;
  recommendedVoiceId: string;
  recommendedStyleId: string;
}

export type EqualizerPreset = 'studio' | 'bass_boost' | 'crisp_voice' | 'warm_radio';
