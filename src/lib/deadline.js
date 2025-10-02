/**
 * Utility functions for deadline management
 */

/**
 * Calculate deadline status with label, color, and severity
 * @param {string} deadline - Date string in YYYY-MM-DD format
 * @returns {Object|null} - { label, color, severity } or null if no deadline
 */
export function getDeadlineStatus(deadline) {
  if (!deadline) return null;
  
  const today = new Date();
  const dl = new Date(deadline + 'T23:59:59');
  
  // Reset hours for accurate day comparison
  dl.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((dl - today) / 86400000);
  
  if (diffDays < 0) {
    return { 
      label: 'Overdue', 
      color: 'bg-red-600/80 text-white', 
      severity: 'overdue' 
    };
  }
  
  if (diffDays === 0) {
    return { 
      label: 'Due Today', 
      color: 'bg-red-500/80 text-white', 
      severity: 'today' 
    };
  }
  
  if (diffDays <= 3) {
    return { 
      label: `H-${diffDays}`, 
      color: 'bg-amber-500/90 text-gray-900', 
      severity: 'soon' 
    };
  }
  
  return { 
    label: dl.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }), 
    color: 'bg-gray-600/70 text-gray-100', 
    severity: 'normal' 
  };
}