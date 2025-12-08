'use client';

import { type ReactElement } from 'react';
import { closestCenter, DndContext } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  horizontalListSortingStrategy,
  rectSwappingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableComponentProps {
  strategy?: 'default' | 'horizontal' | 'vertical' | 'swapping';
  items: any[];
  renderItem: (data: {
    item: any;
    index: number;
    containerProps: ContainerProps;
    listenersProps: ListenersProps;
  }) => ReactElement;
  onChange?: (items: any[]) => void;
  onStart?: () => void;
}

interface SortableItemProps {
  item: any;
  itemIndex: number;
  renderItem: (data: {
    item: any;
    index: number;
    containerProps: ContainerProps;
    listenersProps: ListenersProps;
  }) => ReactElement;
}

interface ContainerProps {
  ref: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
  [key: string]: any;
}

interface ListenersProps {
  [key: string]: any;
}

const SortableComponent = ({ strategy, items, renderItem, onChange, onStart }: SortableComponentProps) => {
  if (items?.length === 0) return null;

  // eslint-disable-next-line react-hooks/purity
  const sortableId = Date.now();

  let strategyProp = rectSortingStrategy;

  if (strategy === 'horizontal') {
    strategyProp = horizontalListSortingStrategy;
  } else if (strategy === 'vertical') {
    strategyProp = verticalListSortingStrategy;
  } else if (strategy === 'swapping') {
    strategyProp = rectSwappingStrategy;
  }

  // related index to items
  const ids = items.map((i) => i.id);

  // on drag start
  const handleDragStart = () => {
    if (onStart) onStart();
  };

  // on drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);

    const sortedItems = arrayMove(items, oldIndex, newIndex);

    if (onChange) onChange(sortedItems);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <SortableContext items={ids} strategy={strategyProp}>
        {items.map((item, itemIndex) => (
          <SortableItem
            key={`${sortableId}-item-${item.id}`}
            item={item}
            itemIndex={itemIndex}
            renderItem={renderItem}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

const SortableItem = ({ item, itemIndex, renderItem }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const containerProps = { ref: setNodeRef, style, ...attributes };
  const listenersProps = { ...listeners };

  return renderItem({ item, index: itemIndex, containerProps, listenersProps });
};

export default SortableComponent;
