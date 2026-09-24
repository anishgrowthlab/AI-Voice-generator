import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { WebAudioEngine, downloadWavBase64 } from '../utils/audioPlayer';
import { EqualizerPreset, GenerationHistoryItem } from '../types/voice';
import { WaveformVisualizer } from './WaveformVisualizer';

interface AudioPlayerBarProps {
  currentClip: GenerationHistoryItem | null;
  audioEngine: WebAudioEngine | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (delta: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  playbackRate: number;
  onRateChange: (rate: number) => void;
  eqPreset: EqualizerPreset;
  onEqChange: (preset: EqualizerPreset) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentClip,
  audioEngine,
  isPlaying,
  currentTime,
  duration,
  onTogglePlayPause,
  onSeek,
  onSkip,
  volume,
  onVolumeChange,
  playbackRate,
  onRateChange,
  eqPreset,
  onEqChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [showEqMenu, setShowEqMenu] = useState(false);

  if (!currentClip) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/60 mx-auto flex items-center justify-center text-slate-500 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300 mb-1">
          No Voice Generated Yet
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Paste your text above and click <strong>&quot;Generate Male US Voice&quot;</strong> to synthesize custom 24kHz American English audio.
        </p>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const total = Math.floor(secs || 0);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = () => {
    if (!currentClip?.audioBase64) return;
    const safeName = `vocalis-${currentClip.voiceName.toLowerCase()}-us-${Date.now()}.wav`;
    downloadWavBase64(currentClip.audioBase64, safeName);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentClip.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4">
      {/* Header Info of Current Clip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <span className="font-bold text-slate-100 text-sm">
              {currentClip.voiceName} (Male US)
            </span>
            <span className="text-slate-500 text-xs mx-1.5">•</span>
            <span className="text-xs text-indigo-300 font-medium">
              {currentClip.styleLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Copy Script */}
          <button
            type="button"
            onClick={handleCopyText}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Copy script text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          {/* Download WAV button */}
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            title="Download studio WAV audio"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>

      {/* Real-time Waveform Canvas */}
      <WaveformVisualizer
        audioEngine={audioEngine}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
      />

      {/* Scrub bar & Time Indicators */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.05"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg hover:h-2 transition-all"
        />
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-500">
            {formatTime(duration)} • 24kHz Mono
          </span>
        </div>
      </div>

      {/* Player Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Playback buttons */}
        <div className="flex items-center space-x-3">
          {/* Skip Back 5s */}
          <button
            type="button"
            onClick={() => onSkip(-5)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90"
            title="Skip back 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Big Play / Pause Button */}
          <button
            type="button"
            onClick={onTogglePlayPause}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
          </button>

          {/* Skip Forward 5s */}
          <button
            type="button"
            onClick={() => onSkip(5)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90"
            title="Skip forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Multiplier selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs text-slate-500 font-medium">Speed:</span>
          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onRateChange(rate)}
              className={`px-2 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Equalizer & Audio Filters */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEqMenu(!showEqMenu)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              eqPreset !== 'studio'
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Equalizer & Tone Filters"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize">
              EQ: {eqPreset === 'bass_boost' ? 'Bass Boost' : eqPreset === 'crisp_voice' ? 'Crisp Voice' : eqPreset === 'warm_radio' ? 'Warm Radio' : 'Studio'}
            </span>
          </button>

          {showEqMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Acoustic EQ Profile
              </div>
              {[
                { id: 'studio', label: 'Studio Neutral', desc: 'Flat acoustic response' },
                { id: 'bass_boost', label: 'Bass Boost (+6dB)', desc: 'Deeper male baritone' },
                { id: 'crisp_voice', label: 'Crisp Clarity', desc: 'Enhanced presence & air' },
                { id: 'warm_radio', label: 'Warm Radio Broadcast', desc: 'Classic vintage resonance' },
              ].map((eq) => (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => {
                    onEqChange(eq.id as EqualizerPreset);
                    setShowEqMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    eqPreset === eq.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div>{eq.label}</div>
                  <div className="text-[10px] opacity-70">{eq.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume slider */}
        <div className="flex items-center space-x-2 min-w-[120px]">
          <button
            type="button"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
