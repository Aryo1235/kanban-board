/**
 * Drag & Drop utility functions for TaskList
 */

/**
 * Calculate estimated height for drop zone preview based on task content
 * @param {Object} task - Task object with title, content, and deadline
 * @returns {number} - Estimated height in pixels
 */
export function calculateDropZoneHeight(task) {
  if (!task) return 6; // default collapsed height
  
  const titleRaw = task.title || '(No Title)';
  const contentRaw = task.content || '';
  
  // Calculate estimated height based on content
  const titleLines = Math.min(2, Math.max(1, Math.ceil(titleRaw.length / 28)));
  const contentLines = contentRaw 
    ? Math.min(5, Math.max(1, Math.ceil(contentRaw.length / 48))) 
    : 0;
  
  const padding = 24;
  const labelHeight = 16;
  const lineHeight = 16;
  const gaps = 6 * (contentRaw ? 2 : 1);
  const deadlineHeight = task.deadline ? 18 : 0;
  
  const estimatedHeight = padding + labelHeight + (titleLines * lineHeight) + 
                         (contentLines * lineHeight) + gaps + deadlineHeight;
  
  // Ensure minimum height
  return Math.max(estimatedHeight, 72);
}

/**
 * Generate preview text for drop zone with truncation
 * @param {Object} task - Task object with title and content
 * @returns {Object} - { previewTitle, previewContent }
 */
export function generatePreviewText(task) {
  if (!task) return { previewTitle: '', previewContent: '' };
  
  const titleRaw = task.title || '(No Title)';
  const contentRaw = task.content || '';
  
  // Character limits for preview text
  const maxTitleChars = 28 * 2; // 2 lines max
  const maxContentChars = 53.5 * 5; // 5 lines max
  
  // Truncate text for preview
  const previewTitle = titleRaw.length > maxTitleChars 
    ? titleRaw.slice(0, maxTitleChars - 3) + '...' 
    : titleRaw;
  const previewContent = contentRaw.length > maxContentChars 
    ? contentRaw.slice(0, maxContentChars - 3) + '...' 
    : contentRaw;
  
  return { previewTitle, previewContent };
}

/**
 * Get drop zone styles based on active state
 * @param {boolean} active - Whether drop zone is active
 * @param {number} estimatedHeight - Height for active state
 * @returns {Object} - Style object for drop zone
 */
export function getDropZoneStyles(active, estimatedHeight = 6) {
  return {
    height: active ? estimatedHeight : 6,
    margin: active ? '4px 0 8px 0' : '0px 0 0px 0',
    borderRadius: active ? 10 : 8,
    backgroundColor: active ? 'rgba(59,130,246,0.10)' : 'transparent',
    border: active ? '2px solid rgba(147,197,253,0.9)' : '2px solid transparent',
    boxShadow: active ? '0 4px 10px -2px rgba(59,130,246,0.35)' : 'none'
  };
}