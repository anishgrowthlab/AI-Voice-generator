import { EqualizerPreset } from '../types/voice';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  eqPreset: EqualizerPreset;
}

export class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // EQ filter nodes
  private lowShelf: BiquadFilterNode | null = null;
  private midPeak: BiquadFilterNode | null = null;
  private highShelf: BiquadFilterNode | null = null;

  private startTime: number = 0;
  private pauseOffset: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private volume: number = 1.0;
  private eqPreset: EqualizerPreset = 'studio';

  private animFrameId: number | null = null;
  private listeners: {
    onTimeUpdate?: (current: number, duration: number) => void;
    onStateChange?: (state: AudioPlayerState) => void;
    onEnded?: () => void;
  } = {};

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;

      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Equalizer filters
      this.lowShelf = this.ctx.createBiquadFilter();
      this.lowShelf.type = 'lowshelf';
      this.lowShelf.frequency.value = 150;

      this.midPeak = this.ctx.createBiquadFilter();
      this.midPeak.type = 'peaking';
      this.midPeak.frequency.value = 2400;
      this.midPeak.Q.value = 1.0;

      this.highShelf = this.ctx.createBiquadFilter();
      this.highShelf.type = 'highshelf';
      this.highShelf.frequency.value = 4000;

      // Chain: Source -> LowShelf -> MidPeak -> HighShelf -> Analyser -> Gain -> Destination
      this.lowShelf.connect(this.midPeak);
      this.midPeak.connect(this.highShelf);
      this.highShelf.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.applyEqPreset(this.eqPreset);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async loadFromBase64(base64Data: string): Promise<number> {
    this.stop();
    this.initContext();

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    this.audioBuffer = await this.ctx!.decodeAudioData(bytes.buffer.slice(0));
    this.pauseOffset = 0;
    this.emitState();
    return this.audioBuffer.duration;
  }

  public play(offsetSec?: number) {
    if (!this.audioBuffer) return;
    this.initContext();

    if (this.isPlaying) {
      this.stopSource();
    }

    if (typeof offsetSec === 'number') {
      this.pauseOffset = Math.max(0, Math.min(offsetSec, this.audioBuffer.duration));
    }

    if (this.pauseOffset >= this.audioBuffer.duration) {
      this.pauseOffset = 0;
    }

    this.sourceNode = this.ctx!.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.playbackRate.value = this.playbackRate;

    this.sourceNode.connect(this.lowShelf!);

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        // Natural end
        this.isPlaying = false;
        this.pauseOffset = 0;
        this.cancelTracking();
        this.emitState();
        this.listeners.onEnded?.();
      }
    };

    this.startTime = this.ctx!.currentTime;
    this.sourceNode.start(0, this.pauseOffset);
    this.isPlaying = true;

    this.startTracking();
    this.emitState();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stopSource();
    this.isPlaying = false;
    this.cancelTracking();
    this.emitState();
  }

  public togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public stop() {
    this.stopSource();
    this.isPlaying = false;
    this.pauseOffset = 0;
    this.cancelTracking();
    this.emitState();
  }

  public seek(targetSec: number) {
    const dur = this.getDuration();
    const clamped = Math.max(0, Math.min(targetSec, dur));
    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.play(clamped);
    } else {
      this.pauseOffset = clamped;
      this.emitState();
      this.listeners.onTimeUpdate?.(clamped, dur);
    }
  }

  public skip(deltaSec: number) {
    const target = this.getCurrentTime() + deltaSec;
    this.seek(target);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.emitState();
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.sourceNode && this.ctx) {
      this.sourceNode.playbackRate.setValueAtTime(rate, this.ctx.currentTime);
    }
    this.emitState();
  }

  public setEqPreset(preset: EqualizerPreset) {
    this.eqPreset = preset;
    this.applyEqPreset(preset);
    this.emitState();
  }

  private applyEqPreset(preset: EqualizerPreset) {
    if (!this.lowShelf || !this.midPeak || !this.highShelf || !this.ctx) return;
    const now = this.ctx.currentTime;

    switch (preset) {
      case 'bass_boost':
        this.lowShelf.gain.setValueAtTime(6.0, now);
        this.midPeak.gain.setValueAtTime(0.0, now);
        this.highShelf.gain.setValueAtTime(-1.0, now);
        break;
      case 'crisp_voice':
        this.lowShelf.gain.setValueAtTime(-2.0, now);
        this.midPeak.gain.setValueAtTime(3.0, now);
        this.highShelf.gain.setValueAtTime(4.5, now);
        break;
      case 'warm_radio':
        this.lowShelf.gain.setValueAtTime(4.0, now);
        this.midPeak.gain.setValueAtTime(2.0, now);
        this.highShelf.gain.setValueAtTime(-2.0, now);
        break;
      case 'studio':
      default:
        this.lowShelf.gain.setValueAtTime(0.0, now);
        this.midPeak.gain.setValueAtTime(0.0, now);
        this.highShelf.gain.setValueAtTime(0.0, now);
        break;
    }
  }

  public getCurrentTime(): number {
    if (!this.audioBuffer) return 0;
    if (!this.isPlaying) return this.pauseOffset;
    if (!this.ctx) return 0;

    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    const current = this.pauseOffset + elapsed;
    return Math.min(current, this.audioBuffer.duration);
  }

  public getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  public getAnalyserData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const buffer = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(buffer);
    return buffer;
  }

  public subscribe(listeners: {
    onTimeUpdate?: (current: number, duration: number) => void;
    onStateChange?: (state: AudioPlayerState) => void;
    onEnded?: () => void;
  }) {
    this.listeners = listeners;
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // already stopped
      }
      this.sourceNode = null;
    }
  }

  private startTracking() {
    this.cancelTracking();
    const tick = () => {
      if (this.isPlaying) {
        const cur = this.getCurrentTime();
        const dur = this.getDuration();
        this.listeners.onTimeUpdate?.(cur, dur);
        this.animFrameId = requestAnimationFrame(tick);
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private cancelTracking() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private emitState() {
    this.listeners.onStateChange?.({
      isPlaying: this.isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.volume,
      playbackRate: this.playbackRate,
      eqPreset: this.eqPreset,
    });
  }

  public destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Global helper to trigger browser download of WAV base64
export function downloadWavBase64(base64: string, filename: string = 'vocalis-male-us-voice.wav') {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
