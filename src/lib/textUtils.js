/**
 * Text measurement and truncation utilities
 */

/**
 * Create a callback ref for measuring text height
 * @param {string} taskId - Task ID for tracking
 * @param {Object} expandedDesc - Object tracking expanded descriptions
 * @param {Object} truncatedDesc - Object tracking truncated descriptions  
 * @param {Function} setTruncatedDesc - Setter for truncated descriptions
 * @returns {Function} - Callback ref function
 */
export function createMeasureRef(taskId, expandedDesc, truncatedDesc, setTruncatedDesc) {
  return (el) => {
    if (!el || expandedDesc[taskId] || truncatedDesc[taskId]) return;
    
    try {
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight) || 16;
      const maxVisible = lineHeight * 5 + 2; // tolerance for 5 lines
      
      if (el.scrollHeight > maxVisible) {
        setTruncatedDesc(prev => ({ ...prev, [taskId]: true }));
      }
    } catch (error) {
      console.warn('Error measuring text height:', error);
    }
  };
}

/**
 * Toggle description expanded state
 * @param {string} taskId - Task ID to toggle
 * @param {Function} setExpandedDesc - Setter for expanded descriptions
 */
export function toggleDescriptionState(taskId, setExpandedDesc) {
  setExpandedDesc(prev => ({ ...prev, [taskId]: !prev[taskId] }));
}