import { useState, useCallback } from 'react';
import { createMeasureRef, toggleDescriptionState } from '../lib/textUtils';

/**
 * Custom hook for managing description expand/collapse functionality
 */
export function useDescriptionManagement() {
  const [expandedDesc, setExpandedDesc] = useState({});
  const [truncatedDesc, setTruncatedDesc] = useState({});

  const toggleDesc = useCallback((taskId) => {
    toggleDescriptionState(taskId, setExpandedDesc);
  }, []);

  const makeMeasureRef = useCallback((taskId) => {
    return createMeasureRef(taskId, expandedDesc, truncatedDesc, setTruncatedDesc);
  }, [expandedDesc, truncatedDesc]);

  return {
    expandedDesc,
    truncatedDesc,
    toggleDesc,
    makeMeasureRef,
  };
}