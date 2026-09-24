/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { StyleSelector } from './components/StyleSelector';
import { ScriptEditor } from './components/ScriptEditor';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { InfoModal } from './components/InfoModal';
import { MALE_US_VOICES, DELIVERY_STYLES, SAMPLE_SCRIPTS } from './data/voices';
import {
  VoicePersona,
  DeliveryStyle,
  GenerationHistoryItem,
  EqualizerPreset,
  SampleScript,
} from './types/voice';
import { WebAudioEngine } from './utils/audioPlayer';
import { speakWithBrowser, stopBrowserSpeech } from './utils/webSpeech';
import { AlertCircle, CheckCircle2, Sparkles, Wand2 } from 'lucide-react';

const STORAGE_KEY = 'vocalis_voice_history_v1';

export default function App() {
  // Primary Voice & Script state
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(MALE_US_VOICES[0]);
  const [selectedStyle, setSelectedStyle] = useState<DeliveryStyle>(DELIVERY_STYLES[1]); // Cinematic
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [text, setText] = useState(
    'In an age forgotten by stars, a lone signal pierced the silence of the outer rim. Some called it a distress call. Others... a warning.'
  );

  // Status and Modals
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Audition state
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  // Audio Engine & Playback state
  const audioEngineRef = useRef<WebAudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [eqPreset, setEqPreset] = useState<EqualizerPreset>('studio');

  // History & Active Clip
  const [currentClip, setCurrentClip] = useState<GenerationHistoryItem | null>(null);
  const [history, setHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Initialize Web Audio Engine once
  useEffect(() => {
    const engine = new WebAudioEngine();
    audioEngineRef.current = engine;

    engine.subscribe({
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        setDuration(dur);
      },
      onStateChange: (st) => {
        setIsPlaying(st.isPlaying);
        setCurrentTime(st.currentTime);
        setDuration(st.duration);
        setVolume(st.volume);
        setPlaybackRate(st.playbackRate);
        setEqPreset(st.eqPreset);
      },
      onEnded: () => {
        setIsPlaying(false);
        setCurrentTime(0);
      },
    });

    return () => {
      engine.destroy();
    };
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [history]);

  // Handle generation call to server
  const handleGenerate = async () => {
    if (!text.trim() || isGenerating) return;

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsGenerating(true);
    stopBrowserSpeech();

    const styleToUse = customStylePrompt.trim()
      ? customStylePrompt.trim()
      : selectedStyle.promptDirective;

    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice.apiVoiceName,
          style: styleToUse,
          speed: speed,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Voice synthesis failed with code ${res.status}`);
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error('Received invalid audio data from speech synthesis service.');
      }

      const newClip: GenerationHistoryItem = {
        id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: text.trim(),
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.name,
        styleLabel: customStylePrompt.trim() ? 'Custom Directive' : selectedStyle.label,
        styleDirective: styleToUse,
        speed: speed,
        durationSec: data.durationEstimateSec || 0,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: Date.now(),
      };

      // Load into audio engine and autoplay
      if (audioEngineRef.current) {
        const dur = await audioEngineRef.current.loadFromBase64(data.audioBase64);
        setDuration(dur);
        audioEngineRef.current.play();
      }

      setCurrentClip(newClip);
      setHistory((prev) => [newClip, ...prev.slice(0, 49)]); // keep latest 50
      setSuccessNotice(`Generated male voice with ${selectedVoice.name}!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('Error in generation:', err);
      setErrorMessage(
        err.message || 'Failed to synthesize speech. Please check your connection and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Audition voice tone
  const handleAuditionVoice = (voice: VoicePersona) => {
    if (isPreviewingVoice) {
      stopBrowserSpeech();
      setIsPreviewingVoice(false);
      setPreviewVoiceId(null);
      return;
    }

    setIsPreviewingVoice(true);
    setPreviewVoiceId(voice.id);

    const auditionLines: Record<string, string> = {
      'marcus-fenrir': "I'm Marcus. Deep, authoritative, and cinematic American voiceover.",
      'ethan-zephyr': "Hey there, I'm Ethan. Smooth, natural American English for your audio.",
      'leo-puck': "What's up! I'm Leo, bringing high energy and charisma to your broadcast.",
      'arthur-charon': "Hello, I am Arthur. Calm, thoughtful, and articulate American narration.",
    };

    const line = auditionLines[voice.id] || `This is ${voice.name} speaking in US English.`;

    speakWithBrowser(line, {
      pitch: voice.id === 'marcus-fenrir' ? 0.75 : voice.id === 'arthur-charon' ? 0.85 : 1.0,
      rate: voice.id === 'leo-puck' ? 1.15 : 1.0,
      onEnd: () => {
        setIsPreviewingVoice(false);
        setPreviewVoiceId(null);
      },
      onError: () => {
        setIsPreviewingVoice(false);
        setPreviewVoiceId(null);
      },
    });
  };

  // Play clip from history
  const handlePlayHistoryClip = async (clip: GenerationHistoryItem) => {
    setCurrentClip(clip);
    if (audioEngineRef.current) {
      await audioEngineRef.current.loadFromBase64(clip.audioBase64);
      audioEngineRef.current.play();
    }
  };

  // Restore history item into editor
  const handleRestoreClip = (clip: GenerationHistoryItem) => {
    setText(clip.text);
    const matchedVoice = MALE_US_VOICES.find((v) => v.id === clip.voiceId);
    if (matchedVoice) setSelectedVoice(matchedVoice);
    setSpeed(clip.speed || 1.0);
    setSuccessNotice(`Loaded clip into editor!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleSelectSample = (sample: SampleScript) => {
    setText(sample.text);
    const matchedVoice = MALE_US_VOICES.find((v) => v.id === sample.recommendedVoiceId);
    if (matchedVoice) setSelectedVoice(matchedVoice);
    const matchedStyle = DELIVERY_STYLES.find((s) => s.id === sample.recommendedStyleId);
    if (matchedStyle) setSelectedStyle(matchedStyle);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Studio Header */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        hasApiConfigured={true}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner notification for success or error */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start space-x-3 text-red-200 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-100">Speech Generation Error</p>
              <p className="text-xs text-red-300 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-400 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center space-x-2.5 text-emerald-200 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successNotice}</span>
          </div>
        )}

        {/* Step 1: Voice Selector */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-sm">
          <VoiceSelector
            selectedVoiceId={selectedVoice.id}
            onSelectVoice={setSelectedVoice}
            onPreviewVoice={handleAuditionVoice}
            isPreviewing={isPreviewingVoice}
            previewVoiceId={previewVoiceId}
          />
        </section>

        {/* Step 2: Delivery Tone & Pacing */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-sm">
          <StyleSelector
            selectedStyleId={selectedStyle.id}
            onSelectStyle={setSelectedStyle}
            customStylePrompt={customStylePrompt}
            onChangeCustomStylePrompt={setCustomStylePrompt}
            speed={speed}
            onChangeSpeed={setSpeed}
          />
        </section>

        {/* Step 3: Script Editor & Primary Action */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-sm">
          <ScriptEditor
            text={text}
            onChangeText={setText}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onSelectSample={handleSelectSample}
            selectedVoiceName={selectedVoice.name}
          />
        </section>

        {/* Studio Audio Output Player Console */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Studio Master Output</span>
            </h3>
          </div>

          <AudioPlayerBar
            currentClip={currentClip}
            audioEngine={audioEngineRef.current}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlayPause={() => audioEngineRef.current?.togglePlayPause()}
            onSeek={(secs) => audioEngineRef.current?.seek(secs)}
            onSkip={(delta) => audioEngineRef.current?.skip(delta)}
            volume={volume}
            onVolumeChange={(v) => audioEngineRef.current?.setVolume(v)}
            playbackRate={playbackRate}
            onRateChange={(r) => audioEngineRef.current?.setPlaybackRate(r)}
            eqPreset={eqPreset}
            onEqChange={(eq) => audioEngineRef.current?.setEqPreset(eq)}
          />
        </section>
      </main>

      {/* History Slide-out Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        currentPlayingId={currentClip?.id || null}
        isPlaying={isPlaying}
        onPlayItem={handlePlayHistoryClip}
        onTogglePlayPause={() => audioEngineRef.current?.togglePlayPause()}
        onRestoreText={handleRestoreClip}
        onDeleteItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
        onClearAll={() => {
          setHistory([]);
          localStorage.removeItem(STORAGE_KEY);
        }}
        onToggleFavorite={(id) =>
          setHistory((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
            )
          )
        }
      />

      {/* Info & Guide Modal */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      {/* Studio Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          Vocalis AI Voice Studio • Powered by Gemini 3.8 Speech Synthesis • 24kHz Lossless WAV Export
        </p>
      </footer>
    </div>
  );
}
