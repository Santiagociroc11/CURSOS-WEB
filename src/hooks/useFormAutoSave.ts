import { useState, useEffect, useRef } from 'react';

interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds
  onSave: (data: any) => Promise<void>;
  enabled?: boolean;
}

export const useFormAutoSave = <T>(
  initialData: T,
  options: AutoSaveOptions
) => {
  const [data, setData] = useState<T>(initialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const { delay = 2000, onSave, enabled = true } = options;

  // Update data and trigger auto-save
  const updateData = (newData: Partial<T>) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    setIsDirty(true);

    if (enabled && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (enabled) {
      timeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          await onSave(updatedData);
          setLastSaved(new Date());
          setIsDirty(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    }
  };

  // Manual save
  const save = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      setIsSaving(true);
      await onSave(data);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form
  const reset = (newData?: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setData(newData || initialData);
    setIsDirty(false);
    setLastSaved(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    updateData,
    save,
    reset,
    isSaving,
    isDirty,
    lastSaved,
  };
};