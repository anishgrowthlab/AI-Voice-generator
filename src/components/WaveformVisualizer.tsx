import React, { useEffect, useRef } from 'react';
import { WebAudioEngine } from '../utils/audioPlayer';

interface WaveformVisualizerProps {
  audioEngine: WebAudioEngine | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioEngine,
  isPlaying,
  currentTime,
  duration,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  // Generate deterministic pseudo-peaks for when audio is stopped/paused
  const staticPeaksRef = useRef<number[]>([]);
  if (staticPeaksRef.current.length === 0) {
    const count = 64;
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      // Natural speech envelope wave
      const envelope = Math.sin((i / count) * Math.PI);
      const rand = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.9));
      peaks.push(Math.max(0.12, envelope * rand));
    }
    staticPeaksRef.current = peaks;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = () => {
      if (!isSubscribed) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 56;
      const barSpacing = 3;
      const totalSpacing = (barCount - 1) * barSpacing;
      const barWidth = Math.max(2, (width - totalSpacing) / barCount);

      const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
      const activeBarIndex = Math.floor(progressRatio * barCount);

      let freqData: Uint8Array | null = null;
      if (isPlaying && audioEngine) {
        freqData = audioEngine.getAnalyserData();
      }

      for (let i = 0; i < barCount; i++) {
        let barHeightRatio = 0.2;

        if (isPlaying && freqData && freqData.length > 0) {
          // Map frequency spectrum to visualizer
          const dataIndex = Math.floor((i / barCount) * (freqData.length / 2));
          const val = freqData[dataIndex] || 0;
          barHeightRatio = Math.max(0.1, val / 255);
        } else {
          // Use stored static speech wave
          const peakIdx = Math.floor((i / barCount) * staticPeaksRef.current.length);
          barHeightRatio = staticPeaksRef.current[peakIdx] || 0.2;
        }

        const barHeight = Math.max(6, barHeightRatio * (height - 12));
        const x = i * (barWidth + barSpacing);
        const y = (height - barHeight) / 2;

        const isPast = i <= activeBarIndex;

        // Gradient coloring
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPast) {
          grad.addColorStop(0, '#38bdf8'); // cyan
          grad.addColorStop(0.5, '#6366f1'); // indigo
          grad.addColorStop(1, '#818cf8'); // light indigo
        } else {
          grad.addColorStop(0, '#334155'); // slate 700
          grad.addColorStop(1, '#1e293b'); // slate 800
        }

        ctx.fillStyle = grad;
        // Rounded bar
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      if (isPlaying) {
        animRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isSubscribed = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, audioEngine]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="relative w-full h-24 bg-slate-950/70 rounded-xl border border-slate-800/80 p-2 flex items-center justify-center cursor-pointer group">
      <canvas
        ref={canvasRef}
        width={700}
        height={80}
        onClick={handleCanvasClick}
        className="w-full h-full block select-none"
      />
      <div className="absolute bottom-1 right-2.5 text-[10px] text-slate-500 font-mono pointer-events-none group-hover:text-slate-400 transition-colors">
        Click waveform to scrub audio
      </div>
    </div>
  );
};
