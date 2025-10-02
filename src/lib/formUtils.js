/**
 * Task form handling utilities
 */

/**
 * Initialize draft data for task editing
 * @param {Object} task - Task object to edit
 * @returns {Object} - Draft object with title, content, deadline
 */
export function initializeDraft(task) {
  return {
    title: task.title || task.content || '', 
    content: task.content || '', 
    deadline: task.deadline || ''
  };
}

/**
 * Validate task form data
 * @param {Object} draft - Draft form data
 * @returns {boolean} - Whether form is valid
 */
export function validateTaskForm(draft) {
  return draft.title && draft.title.trim().length > 0;
}

/**
 * Clean and prepare task data for submission
 * @param {Object} draft - Draft form data
 * @returns {Object} - Cleaned task data
 */
export function prepareTaskData(draft) {
  return {
    title: draft.title.trim(),
    content: draft.content.trim(),
    deadline: draft.deadline || null
  };
}

/**
 * Handle form key events (like Escape to cancel)
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Function} onCancel - Cancel callback
 */
export function handleFormKeyDown(e, onCancel) {
  if (e.key === 'Escape') {
    onCancel();
  }
}