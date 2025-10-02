/**
 * Task filtering and sorting utilities
 */

/**
 * Filter and sort tasks for a specific column
 * @param {Array} tasks - Array of all tasks
 * @param {string} colId - Column ID to filter by
 * @returns {Array} - Filtered and sorted tasks
 */
export function getOrderedTasks(tasks, colId) {
  return tasks
    .filter(t => t.column_id === colId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
}

/**
 * Check if a task is currently being dragged
 * @param {Object} draggedTask - Currently dragged task
 * @param {string} taskId - Task ID to check
 * @returns {boolean} - Whether task is being dragged
 */
export function isTaskBeingDragged(draggedTask, taskId) {
  return draggedTask && draggedTask.task.id === taskId;
}