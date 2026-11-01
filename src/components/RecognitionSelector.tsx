import React, { useState, useEffect } from 'react';
import { Shuffle, RotateCcw, ShieldCheck, CheckCircle, AlertCircle, X } from 'lucide-react';
import type { GraphicalIconItem } from '../types';
import { GRAPHICAL_ICONS, REQUIRED_RECOGNITION_COUNT, getIconComponent } from '../data/graphicalIcons';
import { shuffleArray } from '../utils/crypto';
import { GraphicalGrid } from './GraphicalGrid';

interface RecognitionSelectorProps {
  isSetup: boolean;
  onSubmit: (selectedIds: string[]) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onCancel?: () => void;
}

export const RecognitionSelector = ({
  isSetup,
  onSubmit,
  isLoading = false,
  errorMessage = null,
  onCancel,
}: RecognitionSelectorProps) => {
  // Shuffled items display
  const [items, setItems] = useState<GraphicalIconItem[]>(() =>
    isSetup ? GRAPHICAL_ICONS : shuffleArray(GRAPHICAL_ICONS)
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isComplete = selectedIds.length === REQUIRED_RECOGNITION_COUNT;
  const prevErrorRef = React.useRef(errorMessage);

  // Re-randomize grid coordinates and reset selections upon failed attempt
  useEffect(() => {
    if (errorMessage && errorMessage !== prevErrorRef.current && !isSetup) {
      setItems(shuffleArray(GRAPHICAL_ICONS));
      setSelectedIds([]);
    }
    prevErrorRef.current = errorMessage;
  }, [errorMessage, isSetup]);

  const handleToggleItem = (item: GraphicalIconItem) => {
    if (isLoading) return;

    if (selectedIds.includes(item.id)) {
      setSelectedIds(selectedIds.filter((id: string) => id !== item.id));
    } else {
      if (selectedIds.length < REQUIRED_RECOGNITION_COUNT) {
        setSelectedIds([...selectedIds, item.id]);
      }
    }
  };

  const handleRemoveId = (id: string) => {
    if (isLoading) return;
    setSelectedIds(selectedIds.filter((selectedId: string) => selectedId !== id));
  };

  const handleReset = () => {
    if (isLoading) return;
    setSelectedIds([]);
  };

  const handleShuffle = () => {
    setItems(shuffleArray(items));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete && !isLoading) {
      onSubmit(selectedIds);
    }
  };

  return (
    <div className="w-full space-y-5 text-left">
      {/* Instructions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              Zero Trust MFA • Factor 2
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            {isSetup
              ? 'Configure Enterprise Visual Key'
              : 'Visual Key Verification Challenge'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isSetup
              ? `Select any ${REQUIRED_RECOGNITION_COUNT} visual cybersecurity assets to serve as your secondary MFA token.`
              : `Select your ${REQUIRED_RECOGNITION_COUNT} registered visual assets. Grid positions are dynamically randomized for anti-shoulder-surfing.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            id="shuffle-recognition-btn"
            onClick={handleShuffle}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
              border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900
              hover:border-cyber-500/50 hover:text-cyber-500 transition-colors shadow-sm"
            title="Randomize grid positions (Fisher-Yates)"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Re-Shuffle Grid</span>
          </button>

          <button
            type="button"
            id="reset-recognition-btn"
            onClick={handleReset}
            disabled={isLoading || selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
              border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900
              hover:border-rose-500/50 hover:text-rose-500 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
            title="Clear current selection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Selected Items Tray */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Selected Visual Tokens:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {selectedIds.length} / {REQUIRED_RECOGNITION_COUNT}
          </span>
        </div>

        {/* Selected preview pills */}
        <div className="flex flex-wrap items-center gap-2 min-h-[34px]">
          {selectedIds.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No visual markers selected yet</span>
          ) : (
            selectedIds.map((id: string) => {
              const item = GRAPHICAL_ICONS.find((i) => i.id === id);
              if (!item) return null;
              const IconComp = getIconComponent(item.iconKey);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <IconComp className="w-3.5 h-3.5 text-cyber-500" />
                  <span>{item.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveId(id)}
                    className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500"
                    title={`Remove ${item.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3 shadow-sm animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold">MFA Verification Notice:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* Graphical Icon Grid */}
      <GraphicalGrid
        items={items}
        selectedIds={selectedIds}
        onItemClick={handleToggleItem}
        mode="recognition"
        disabled={isLoading}
      />

      {/* Submission Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <span />
          )}
        </div>

        <button
          type="submit"
          id="submit-recognition-btn"
          onClick={handleSubmit}
          disabled={!isComplete || isLoading}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-cyber
            ${
              isComplete && !isLoading
                ? 'bg-gradient-to-r from-teal-500 to-cyber-500 hover:from-teal-400 hover:to-cyber-400 text-slate-950 cursor-pointer active:scale-98'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Verifying Visual Tokens...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>
                {isSetup ? 'Enroll Visual MFA Key' : 'Authorize Workplace Session'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
