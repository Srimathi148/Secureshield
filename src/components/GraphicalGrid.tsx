import type { GraphicalIconItem } from '../types';
import { GraphicalItemCard } from './GraphicalItemCard';

interface GraphicalGridProps {
  items: GraphicalIconItem[];
  selectedIds: string[]; // For recognition mode
  sequenceIds?: string[]; // For recall mode
  onItemClick: (item: GraphicalIconItem) => void;
  mode: 'recognition' | 'recall';
  disabled?: boolean;
}

export const GraphicalGrid = ({
  items,
  selectedIds,
  sequenceIds = [],
  onItemClick,
  mode,
  disabled = false,
}: GraphicalGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 p-1">
      {items.map((item) => {
        const isSelected =
          mode === 'recognition'
            ? selectedIds.includes(item.id)
            : sequenceIds.includes(item.id);

        const sequenceIndex =
          mode === 'recall'
            ? sequenceIds.indexOf(item.id) !== -1
              ? sequenceIds.indexOf(item.id)
              : null
            : null;

        return (
          <GraphicalItemCard
            key={item.id}
            item={item}
            isSelected={isSelected}
            sequenceIndex={sequenceIndex}
            onClick={onItemClick}
            disabled={disabled}
            mode={mode}
          />
        );
      })}
    </div>
  );
};
