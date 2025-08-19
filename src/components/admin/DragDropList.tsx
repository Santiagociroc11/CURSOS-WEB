import React, { useState, useRef } from 'react';
import { GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

interface DragDropItem {
  id: string;
  order_index: number;
  [key: string]: any;
}

interface DragDropListProps<T extends DragDropItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  keyExtractor?: (item: T) => string;
  className?: string;
  disabled?: boolean;
}

export function DragDropList<T extends DragDropItem>({
  items,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.id,
  className = '',
  disabled = false
}: DragDropListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    
    setDraggedIndex(index);
    dragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // For Firefox compatibility
    
    // Add some visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (disabled) return;
    
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragRef.current !== null && dragRef.current !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    if (disabled) return;
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (disabled) return;
    
    e.preventDefault();
    
    const dragIndex = dragRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      return;
    }

    // Create new array with reordered items
    const newItems = [...items];
    const draggedItem = newItems[dragIndex];
    
    // Remove from old position
    newItems.splice(dragIndex, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem);
    
    // Update order_index for all items
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order_index: index
    }));

    onReorder(reorderedItems);
    setDragOverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      moveItem(index, index - 1);
    } else if (e.key === 'ArrowDown' && index < items.length - 1) {
      e.preventDefault();
      moveItem(index, index + 1);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    
    const newItems = [...items];
    const item = newItems[fromIndex];
    newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, item);
    
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order_index: index
    }));

    onReorder(reorderedItems);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;
        
        return (
          <div
            key={keyExtractor(item)}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={disabled ? -1 : 0}
            className={`
              group relative flex items-center bg-white border rounded-lg transition-all duration-200
              ${!disabled ? 'cursor-move hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500' : 'cursor-default'}
              ${isDragging ? 'shadow-lg scale-105 z-10' : ''}
              ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
              ${disabled ? 'opacity-60' : ''}
            `}
          >
            {/* Drag Handle */}
            {!disabled && (
              <div className="flex-shrink-0 px-3 py-4 cursor-grab active:cursor-grabbing">
                <GripVertical 
                  className={`h-4 w-4 transition-colors ${
                    isDragging ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'
                  }`} 
                />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {renderItem(item, index, isDragging)}
            </div>
            
            {/* Drop Indicator */}
            {isDragOver && (
              <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none" />
            )}
          </div>
        );
      })}
      
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay elementos para mostrar</p>
          <p className="text-sm">Los elementos aparecerán aquí cuando los agregues</p>
        </div>
      )}
    </div>
  );
}

// Hook for managing drag and drop state
export const useDragDropReorder = <T extends DragDropItem>(
  initialItems: T[],
  onUpdate?: (items: T[]) => Promise<void>
) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReorder = async (newItems: T[]) => {
    setItems(newItems);
    
    if (onUpdate) {
      try {
        setIsUpdating(true);
        await onUpdate(newItems);
      } catch (error) {
        console.error('Failed to update order:', error);
        // Revert on error
        setItems(initialItems);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const reset = () => {
    setItems(initialItems);
  };

  return {
    items,
    handleReorder,
    isUpdating,
    reset,
    setItems
  };
};