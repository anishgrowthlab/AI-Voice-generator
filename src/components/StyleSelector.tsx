import React, { useState } from 'react';
import { DeliveryStyle } from '../types/voice';
import { DELIVERY_STYLES } from '../data/voices';
import {
  MessageSquare,
  Film,
  Radio,
  Cpu,
  Sparkles,
  Flame,
  Moon,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (style: DeliveryStyle) => void;
  customStylePrompt: string;
  onChangeCustomStylePrompt: (val: string) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyleId,
  onSelectStyle,
  customStylePrompt,
  onChangeCustomStylePrompt,
  speed,
  onChangeSpeed,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film':
        return <Film className="w-3.5 h-3.5" />;
      case 'Radio':
        return <Radio className="w-3.5 h-3.5" />;
      case 'Cpu':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Flame':
        return <Flame className="w-3.5 h-3.5" />;
      case 'Moon':
        return <Moon className="w-3.5 h-3.5" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>2. Delivery Style & Tone</span>
        </h3>
        <button
          type="button"
          onClick={() => setIsCustomMode(!isCustomMode)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isCustomMode ? 'Use Style Presets' : 'Custom Prompt Directive'}</span>
        </button>
      </div>

      {!isCustomMode ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {DELIVERY_STYLES.map((style) => {
            const isSelected = style.id === selectedStyleId;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onSelectStyle(style)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/40 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <span className={isSelected ? 'text-white' : 'text-indigo-400'}>
                    {getStyleIcon(style.icon)}
                  </span>
                  <span className="text-xs font-semibold truncate">{style.label}</span>
                </div>
                <p
                  className={`text-[10px] leading-tight line-clamp-2 ${
                    isSelected ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {style.description}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-indigo-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300">Custom Voice Style Directive:</span>
            <span className="text-slate-400 text-[11px]">Directs tone, emotion & acoustic cadence</span>
          </div>
          <textarea
            value={customStylePrompt}
            onChange={(e) => onChangeCustomStylePrompt(e.target.value)}
            placeholder="e.g. Speak with a gritty, deep southern US accent. Slow and measured cadence, slightly breathy with intense conviction."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
          />
        </div>
      )}

      {/* Speed and Advanced delivery options */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          <span>Tempo & Pacing Tuning (Current: {speed}x)</span>
        </button>

        {showAdvanced && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
              <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                Pacing:
              </span>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono font-bold text-indigo-400 min-w-[3rem]">
                {speed.toFixed(2)}x
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center space-x-1">
              {[0.85, 1.0, 1.15, 1.3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeSpeed(val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    speed === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {val === 1.0 ? 'Normal' : `${val}x`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
