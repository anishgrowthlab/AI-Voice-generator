import React from 'react';
import { X, Mic, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">
              Male US Voice Generation Guide
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[75vh] overflow-y-auto">
          <div>
            <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-indigo-400" />
              Pre-Tuned Male US Personas
            </h4>
            <p className="text-slate-400 text-xs">
              Every voice in Vocalis is specifically generated in authentic American (US) English with distinct timbre characteristics:
            </p>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-slate-200 min-w-[5rem]">Marcus:</span>
                <span className="text-slate-400">Deep, resonant baritone. Commanding trailer voiceover & audiobook narrator.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-slate-200 min-w-[5rem]">Ethan:</span>
                <span className="text-slate-400">Warm, conversational, natural cadence. Ideal for podcasts, tutorials & demos.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-slate-200 min-w-[5rem]">Leo:</span>
                <span className="text-slate-400">Upbeat, charismatic commercial radio presenter. Dynamic and punchy.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-slate-200 min-w-[5rem]">Arthur:</span>
                <span className="text-slate-400">Thoughtful, measured, intellectual narrator. Perfect for calm guides & essays.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Pauses and Vocal Bursts
            </h4>
            <p className="text-slate-400 text-xs">
              Enhance natural rhythm by inserting pauses or expressive acoustic inflections directly into your script:
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-indigo-400">...</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Short conversational pause</p>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-indigo-400">[pause]</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Deeper dramatic pause</p>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-indigo-400">&lt;breath&gt;</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Subtle natural intake breath</p>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-indigo-400">&lt;laugh&gt;</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Light chuckle inflection</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Studio Audio Features
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li><strong>24kHz Broadcast Quality:</strong> High sample rate PCM audio exported directly to lossless WAV.</li>
              <li><strong>Live EQ Filters:</strong> Toggle Bass Boost, Warm Radio, or Crisp Voice in real-time.</li>
              <li><strong>Scrubbable Waveform:</strong> Click on any bar to jump to that timestamp instantly.</li>
              <li><strong>Local Storage Memory:</strong> Your generated clips are saved locally for instant access.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
