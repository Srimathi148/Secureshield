import React from 'react';
import { Check } from 'lucide-react';
import type { GraphicalIconItem } from '../types';
import { getIconComponent } from '../data/graphicalIcons';

interface GraphicalItemCardProps {
  item: GraphicalIconItem;
  isSelected: boolean;
  sequenceIndex?: number | null; // For recall mode (0-indexed or 1-indexed)
  onClick: (item: GraphicalIconItem) => void;
  disabled?: boolean;
  mode?: 'recognition' | 'recall';
}

export const GraphicalItemCard = ({
  item,
  isSelected,
  sequenceIndex,
  onClick,
  disabled = false,
  mode = 'recognition',
}: GraphicalItemCardProps) => {

  return (
    <button
      type="button"
      id={`graphical-item-${item.id}`}
      disabled={disabled}
      onClick={() => onClick(item)}
      className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border text-center transition-all duration-200 select-none
        ${
          isSelected
            ? 'bg-cyber-500/10 dark:bg-cyber-500/20 border-cyber-500 shadow-cyber ring-2 ring-cyber-500/40 transform -translate-y-0.5'
            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
      `}
      aria-pressed={isSelected}
      aria-label={`${item.name} (${item.category})`}
    >
      {/* Sequence Badge for Recall Mode */}
      {mode === 'recall' && sequenceIndex !== undefined && sequenceIndex !== null && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-cyber-500 text-slate-950 text-xs font-bold font-mono flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-navy-950 animate-in zoom-in-50 duration-150">
          {sequenceIndex + 1}
        </span>
      )}

      {/* Checkmark Badge for Recognition Mode */}
      {mode === 'recognition' && isSelected && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white dark:ring-navy-950 animate-in zoom-in-50 duration-150">
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
      )}

      {/* Icon Wrapper */}
      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-all duration-200 mb-2
          ${
            isSelected
              ? 'bg-cyber-500 text-slate-950 shadow-cyber-sm'
              : `${item.accent.bg} ${item.accent.text} group-hover:scale-105`
          }
        `}
      >
        {React.createElement(getIconComponent(item.iconKey), { className: 'w-6 h-6 stroke-[1.8]' })}
      </div>

      {/* Item Name */}
      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-cyber-600 dark:group-hover:text-cyber-400 transition-colors">
        {item.name}
      </div>

      {/* Category Pill */}
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
        {item.category}
      </div>
    </button>
  );
};
