import React from 'react';
import {
  X,
  Play,
  Pause,
  Download,
  Trash2,
  Share2,
  Clock,
  Sparkles,
  Star,
  FileEdit,
} from 'lucide-react';
import { GenerationHistoryItem } from '../types/voice';
import { downloadWavBase64 } from '../utils/audioPlayer';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: GenerationHistoryItem[];
  currentPlayingId: string | null;
  isPlaying: boolean;
  onPlayItem: (item: GenerationHistoryItem) => void;
  onTogglePlayPause: () => void;
  onRestoreText: (item: GenerationHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onToggleFavorite: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currentPlayingId,
  isPlaying,
  onPlayItem,
  onTogglePlayPause,
  onRestoreText,
  onDeleteItem,
  onClearAll,
  onToggleFavorite,
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col">
        {/* Top bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base text-slate-100">Generation History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {items.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-950/40"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">No voice clips generated yet</p>
              <p className="text-xs max-w-xs mx-auto">
                Any voices you generate will be safely saved here so you can replay or download them anytime.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isThisPlaying = currentPlayingId === item.id && isPlaying;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    currentPlayingId === item.id
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-200">
                          {item.voiceName} (US Male)
                        </span>
                        <span className="text-[11px] text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40">
                          {item.styleLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDate(item.createdAt)} • ~{item.durationSec}s
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.id)}
                      className={`p-1 rounded transition-colors ${
                        item.isFavorite
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Text snippet */}
                  <p className="text-xs text-slate-300 line-clamp-3 mb-3 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 font-sans leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>

                  {/* Bottom action buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      {/* Play/Pause */}
                      <button
                        type="button"
                        onClick={() => {
                          if (currentPlayingId === item.id) {
                            onTogglePlayPause();
                          } else {
                            onPlayItem(item);
                          }
                        }}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isThisPlaying
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isThisPlaying ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play</span>
                          </>
                        )}
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() =>
                          downloadWavBase64(
                            item.audioBase64,
                            `vocalis-${item.voiceName.toLowerCase()}-${item.id.slice(0, 6)}.wav`
                          )
                        }
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Download WAV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Restore to editor */}
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreText(item);
                          onClose();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="Load text & voice into editor"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
