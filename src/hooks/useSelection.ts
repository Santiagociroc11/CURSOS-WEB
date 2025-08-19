import { useState, useCallback } from 'react';

interface SelectionOptions {
  multiSelect?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const useSelection = (options: SelectionOptions = {}) => {
  const { multiSelect = true, onSelectionChange } = options;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const select = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      if (!multiSelect) {
        // Single select mode
        newSet.clear();
        newSet.add(id);
      } else {
        // Multi select mode
        newSet.add(id);
      }
      
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [multiSelect, onSelectionChange]);

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [onSelectionChange]);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!multiSelect) {
          newSet.clear();
        }
        newSet.add(id);
      }
      
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [multiSelect, onSelectionChange]);

  const selectAll = useCallback((ids: string[]) => {
    if (!multiSelect) return;
    
    setSelectedIds(prev => {
      const newSet = new Set(ids);
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [multiSelect, onSelectionChange]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const selectRange = useCallback((fromId: string, toId: string, allIds: string[]) => {
    if (!multiSelect) return;
    
    const fromIndex = allIds.indexOf(fromId);
    const toIndex = allIds.indexOf(toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);
    
    const rangeIds = allIds.slice(startIndex, endIndex + 1);
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      rangeIds.forEach(id => newSet.add(id));
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [multiSelect, onSelectionChange]);

  const getSelectedArray = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  const getSelectedCount = useCallback(() => {
    return selectedIds.size;
  }, [selectedIds]);

  const isAllSelected = useCallback((allIds: string[]) => {
    return allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  }, [selectedIds]);

  const isPartiallySelected = useCallback((allIds: string[]) => {
    return selectedIds.size > 0 && selectedIds.size < allIds.length && allIds.some(id => selectedIds.has(id));
  }, [selectedIds]);

  return {
    selectedIds: getSelectedArray(),
    selectedCount: getSelectedCount(),
    isSelected,
    select,
    deselect,
    toggle,
    selectAll,
    clear,
    selectRange,
    isAllSelected,
    isPartiallySelected,
  };
};