export interface WebSpeechVoiceInfo {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
}

export function getBrowserUSMaleVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v) => {
    const isEnUS = v.lang.toLowerCase().startsWith('en-us') || v.lang.toLowerCase() === 'en_us';
    const nameLower = v.name.toLowerCase();
    const isMaleIndicative =
      nameLower.includes('david') ||
      nameLower.includes('guy') ||
      nameLower.includes('mark') ||
      nameLower.includes('alex') ||
      nameLower.includes('male') ||
      nameLower.includes('george') ||
      nameLower.includes('natural');
    return isEnUS && (isMaleIndicative || !nameLower.includes('female'));
  });
}

export function speakWithBrowser(
  text: string,
  options?: {
    pitch?: number;
    rate?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onError?.(new Error('Browser does not support SpeechSynthesis'));
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate || 1.0;
  utterance.pitch = options?.pitch || 0.95; // Slightly lower pitch for male tone

  const maleVoices = getBrowserUSMaleVoices();
  if (maleVoices.length > 0) {
    utterance.voice = maleVoices[0];
  } else {
    // Fallback to any en-US
    const all = window.speechSynthesis.getVoices();
    const enUs = all.find((v) => v.lang.toLowerCase().includes('en-us'));
    if (enUs) utterance.voice = enUs;
  }

  utterance.onend = () => {
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    options?.onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopBrowserSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
