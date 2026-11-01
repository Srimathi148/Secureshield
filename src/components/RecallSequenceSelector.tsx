import React, { useState, useEffect } from 'react';
import { Shuffle, RotateCcw, ArrowRight, CheckCircle, AlertCircle, KeyRound, Undo2 } from 'lucide-react';
import type { GraphicalIconItem } from '../types';
import { GRAPHICAL_ICONS, REQUIRED_RECALL_MIN_COUNT, getIconComponent } from '../data/graphicalIcons';
import { shuffleArray } from '../utils/crypto';
import { GraphicalGrid } from './GraphicalGrid';

interface RecallSequenceSelectorProps {
  isSetup: boolean;
  onSubmit: (sequenceIds: string[]) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onCancel?: () => void;
}

export const RecallSequenceSelector = ({
  isSetup,
  onSubmit,
  isLoading = false,
  errorMessage = null,
  onCancel,
}: RecallSequenceSelectorProps) => {
  // Shuffled items display
  const [items, setItems] = useState<GraphicalIconItem[]>(() =>
    isSetup ? GRAPHICAL_ICONS : shuffleArray(GRAPHICAL_ICONS)
  );

  const [sequenceIds, setSequenceIds] = useState<string[]>([]);
  const isComplete = sequenceIds.length === REQUIRED_RECALL_MIN_COUNT;
  const prevErrorRef = React.useRef(errorMessage);

  // Re-randomize grid coordinates and reset sequence upon failed attempt
  useEffect(() => {
    if (errorMessage && errorMessage !== prevErrorRef.current && !isSetup) {
      setItems(shuffleArray(GRAPHICAL_ICONS));
      setSequenceIds([]);
    }
    prevErrorRef.current = errorMessage;
  }, [errorMessage, isSetup]);

  const handleItemClick = (item: GraphicalIconItem) => {
    if (isLoading) return;

    if (sequenceIds.includes(item.id)) {
      setSequenceIds(sequenceIds.filter((id: string) => id !== item.id));
      return;
    }

    if (sequenceIds.length < REQUIRED_RECALL_MIN_COUNT) {
      setSequenceIds([...sequenceIds, item.id]);
    }
  };

  const handleUndo = () => {
    if (isLoading || sequenceIds.length === 0) return;
    setSequenceIds(sequenceIds.slice(0, -1));
  };

  const handleReset = () => {
    if (isLoading) return;
    setSequenceIds([]);
  };

  const handleShuffle = () => {
    setItems(shuffleArray(items));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete && !isLoading) {
      onSubmit(sequenceIds);
    }
  };

  return (
    <div className="w-full space-y-5 text-left">
      {/* Instructions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
              Zero Trust MFA • Sequential Factor 2
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-cyan-500" />
            {isSetup
              ? 'Configure Sequential Visual Key Pathway'
              : 'Sequential Visual Key Challenge'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isSetup
              ? `Select ${REQUIRED_RECALL_MIN_COUNT} cybersecurity assets in an ordered sequential pathway. Both tokens and their exact sequence order are strictly verified.`
              : `Reproduce your enrolled visual sequence in exact order. Grid coordinates are dynamically scrambled.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            id="shuffle-recall-btn"
            onClick={handleShuffle}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
              border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900
              hover:border-cyber-500/50 hover:text-cyber-500 transition-colors shadow-sm"
            title="Randomize grid positions"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Re-Shuffle</span>
          </button>

          <button
            type="button"
            id="undo-recall-btn"
            onClick={handleUndo}
            disabled={isLoading || sequenceIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
              border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900
              hover:border-amber-500/50 hover:text-amber-500 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
            title="Undo last step"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            id="reset-recall-btn"
            onClick={handleReset}
            disabled={isLoading || sequenceIds.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border
              border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900
              hover:border-rose-500/50 hover:text-rose-500 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
            title="Reset sequence"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Sequential Pathway Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ordered Cryptographic Pathway:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              isComplete
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Step {sequenceIds.length} of {REQUIRED_RECALL_MIN_COUNT}
          </span>
        </div>

        {/* Sequence Steps Flow */}
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: REQUIRED_RECALL_MIN_COUNT }).map((_, idx) => {
            const id = sequenceIds[idx];
            const item = id ? GRAPHICAL_ICONS.find((i) => i.id === id) : null;
            const IconComp = item ? getIconComponent(item.iconKey) : null;

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-colors ${
                      idx <= sequenceIds.length
                        ? 'text-cyan-500'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    item
                      ? 'bg-white dark:bg-slate-800 border-cyan-500/50 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-mono text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {item && IconComp ? (
                    <div className="flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">Awaiting input</span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
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
        selectedIds={[]}
        sequenceIds={sequenceIds}
        onItemClick={handleItemClick}
        mode="recall"
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
          id="submit-recall-btn"
          onClick={handleSubmit}
          disabled={!isComplete || isLoading}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-cyber
            ${
              isComplete && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 cursor-pointer active:scale-98'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Verifying Sequential Tokens...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>{isSetup ? 'Enroll Sequence Key' : 'Authorize Workplace Session'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
