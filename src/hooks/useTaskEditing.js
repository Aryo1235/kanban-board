import { useState, useCallback } from 'react';
import { initializeDraft } from '../lib/formUtils';

/**
 * Custom hook for managing task editing state and operations
 */
export function useTaskEditing(canEdit, handleUpdateTask) {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  const startEditTask = useCallback((task) => {
    if (!canEdit) return;
    setEditingTaskId(task.id);
    setDraft(initializeDraft(task));
  }, [canEdit]);

  const cancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setDraft({ title: '', content: '', deadline: '' });
  }, []);

  const submitEdit = useCallback(async (taskId, taskData) => {
    setSaving(true);
    const success = await handleUpdateTask(taskId, taskData);
    setSaving(false);
    
    if (success) {
      setEditingTaskId(null);
      setDraft({ title: '', content: '', deadline: '' });
    }
    
    return success;
  }, [handleUpdateTask]);

  return {
    editingTaskId,
    draft,
    setDraft,
    saving,
    startEditTask,
    cancelEdit,
    submitEdit,
  };
}