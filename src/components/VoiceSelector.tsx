import React from 'react';
import { VoicePersona } from '../types/voice';
import { MALE_US_VOICES } from '../data/voices';
import { Check, Mic, Volume2, Shield, Zap, BookOpen } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voice: VoicePersona) => void;
  onPreviewVoice?: (voice: VoicePersona) => void;
  isPreviewing?: boolean;
  previewVoiceId?: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  isPreviewing,
  previewVoiceId,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      default:
        return <Mic className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>1. Select Male US Voice</span>
            <span className="text-[11px] font-normal lowercase tracking-normal text-slate-400">
              (All 4 personas tuned for American English)
            </span>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MALE_US_VOICES.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isThisPreviewing = isPreviewing && previewVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`relative group rounded-xl p-3.5 cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900/90 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badge if present */}
              {voice.badge && (
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      voice.badge === 'Popular'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : voice.badge === 'Versatile'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {voice.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center shadow-inner`}>
                    {getIcon(voice.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-100 text-sm">{voice.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                        US
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-indigo-300">{voice.tagline}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                  {voice.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewVoice?.(voice);
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    isThisPreviewing
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Listen to quick tone preview"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isThisPreviewing ? 'Auditioning...' : 'Audition'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
