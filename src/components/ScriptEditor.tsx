import React, { useRef } from 'react';
import {
  Clipboard,
  Trash2,
  BookOpen,
  Sparkles,
  Play,
  Loader2,
  Clock,
  FileText,
  Volume2,
} from 'lucide-react';
import { SAMPLE_SCRIPTS } from '../data/voices';
import { SampleScript } from '../types/voice';

interface ScriptEditorProps {
  text: string;
  onChangeText: (text: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onSelectSample: (sample: SampleScript) => void;
  selectedVoiceName: string;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChangeText,
  onGenerate,
  isGenerating,
  onSelectSample,
  selectedVoiceName,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Text metrics
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Standard speech rate: ~140 words per minute -> ~2.3 words per second
  const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.3));

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          onChangeText(clipText);
          textareaRef.current?.focus();
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
    }
  };

  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + (before.endsWith(' ') || before.length === 0 ? '' : ' ') + tag + ' ' + after;
    onChangeText(newText);

    setTimeout(() => {
      el.focus();
      const pos = start + tag.length + 1;
      el.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && text.trim()) {
        onGenerate();
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Editor top header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>3. Paste or Type Your Script</span>
        </h3>

        <div className="flex items-center space-x-2">
          {/* Paste button */}
          <button
            type="button"
            onClick={handlePaste}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors active:scale-95"
            title="Paste text from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Paste from Clipboard</span>
          </button>

          {/* Clear button */}
          {text.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeText('')}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/50 border border-slate-700 hover:border-red-800 text-slate-400 hover:text-red-300 text-xs transition-colors"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sample Scripts selector dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sample Scripts</span>
            </button>

            <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 hidden group-hover:block transition-all">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Select a Template
              </div>
              <div className="space-y-0.5">
                {SAMPLE_SCRIPTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-indigo-600/30 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium truncate">{sample.title}</span>
                    <span className="text-[10px] text-indigo-400 px-1.5 py-0.5 bg-indigo-950/60 rounded">
                      {sample.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Textarea Container */}
      <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/90 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste or write your text here in English... (e.g. 'Welcome to our premiere broadcast. Tonight, we uncover the hidden mechanisms of sound synthesis.')"
          rows={6}
          className="w-full p-4 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm md:text-base leading-relaxed resize-none focus:outline-none font-sans"
        />

        {/* Expression enhancement chips */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Insert Cadence:
            </span>
            {[
              { label: 'Short Pause', tag: '...' },
              { label: 'Long Pause', tag: '[pause]' },
              { label: 'Breath', tag: '<breath>' },
              { label: 'Laugh', tag: '<laugh>' },
              { label: '|yeah|', tag: '|yeah|' },
              { label: '|mhm|', tag: '|mhm|' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleInsertTag(chip.tag)}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Real-time word & time counters */}
          <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-500" />
              {wordCount} {wordCount === 1 ? 'word' : 'words'} ({charCount} chars)
            </span>
            <span className="flex items-center gap-1 text-indigo-300 font-medium">
              <Clock className="w-3 h-3" />
              ~{estimatedSeconds}s audio
            </span>
          </div>
        </div>
      </div>

      {/* Primary Generation Call to Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            Generating with voice <strong className="text-slate-200">{selectedVoiceName}</strong> (Male US Accent)
          </span>
        </div>

        <button
          type="button"
          disabled={isGenerating || !text.trim()}
          onClick={onGenerate}
          className={`relative px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-200 flex items-center justify-center space-x-2.5 select-none active:scale-[0.98] ${
            isGenerating || !text.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-indigo-400/40 cursor-pointer'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Synthesizing Male US Voice...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Generate Male US Voice</span>
              <span className="hidden md:inline-block ml-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                ⌘+Enter
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
