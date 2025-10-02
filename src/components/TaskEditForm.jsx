import React from 'react';
import { validateTaskForm, prepareTaskData, handleFormKeyDown } from '../lib/formUtils';

/**
 * TaskEditForm component - handles task editing form
 */
export default function TaskEditForm({
  task,
  draft,
  setDraft,
  saving,
  onSubmit,
  onCancel,
}) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateTaskForm(draft)) return;
    
    const taskData = prepareTaskData(draft);
    await onSubmit(task.id, taskData);
  };

  const handleKeyDown = (e) => {
    handleFormKeyDown(e, onCancel);
  };

  const updateDraft = (field) => (e) => {
    setDraft(d => ({ ...d, [field]: e.target.value }));
  };

  const clearDeadline = () => {
    setDraft(d => ({ ...d, deadline: '' }));
  };

  return (
    <div className="bg-gray-700 text-white p-3 rounded-md shadow-sm mb-1 transition-all duration-150 ring-2 ring-lime-400">
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <input
          className="w-full px-2 py-1 rounded bg-gray-800 text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
          value={draft.title}
          onChange={updateDraft('title')}
          autoFocus
          onKeyDown={handleKeyDown}
          placeholder="Judul"
        />
        <textarea
          className="w-full px-2 py-1 rounded bg-gray-800 text-xs border border-gray-600 resize-none h-20 leading-snug focus:outline-none focus:ring-1 focus:ring-lime-400 break-anywhere"
          value={draft.content}
          onChange={updateDraft('content')}
          placeholder="Deskripsi"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-2 py-1 rounded bg-gray-800 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
            value={draft.deadline || ''}
            onChange={updateDraft('deadline')}
          />
          {draft.deadline && (
            <button
              type="button"
              className="text-[10px] text-gray-300 hover:text-red-300"
              onClick={clearDeadline}
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-500"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-3 py-1 text-xs font-semibold rounded bg-lime-600 hover:bg-lime-700 text-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}