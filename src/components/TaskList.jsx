import React, { useState, useCallback, useEffect, useRef } from "react";
import { FiTrash2, FiEdit2, FiCalendar, FiX } from 'react-icons/fi';

export default function TaskList({
  tasks,
  colId,
  canEdit,
  draggedTask,
  handleDragStartTask,
  handleDeleteTask,
  handleDropOnTask,
  handleUpdateTask,
}) {
  // Urutkan berdasarkan position agar konsisten
  const ordered = tasks
    .filter((t) => t.column_id === colId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const [hoverIndex, setHoverIndex] = useState(null); // posisi drop sementara
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [quickDeadlineTaskId, setQuickDeadlineTaskId] = useState(null);
  const [quickDeadlineValue, setQuickDeadlineValue] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState({}); // { taskId: true }
  const [truncatedDesc, setTruncatedDesc] = useState({}); // { taskId: true }

  const toggleDesc = (taskId) => {
    setExpandedDesc((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Callback ref generator to measure if content exceeds 5 lines when not expanded
  const makeMeasureRef = (taskId) => (el) => {
    if (!el) return;
    if (expandedDesc[taskId]) return; // don't measure expanded state
    // Avoid re-measuring if already marked truncated
    if (truncatedDesc[taskId]) return;
    try {
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight) || 16;
      const maxVisible = lineHeight * 5 + 2; // tolerance
      if (el.scrollHeight > maxVisible) {
        setTruncatedDesc((prev) => ({ ...prev, [taskId]: true }));
      }
    } catch (_) {}
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const dl = new Date(deadline + 'T23:59:59');
    dl.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diffDays = Math.round((dl - today) / 86400000);
    if (diffDays < 0) return { label: 'Overdue', color: 'bg-red-600/80 text-white', severity: 'overdue' };
    if (diffDays === 0) return { label: 'Due Today', color: 'bg-red-500/80 text-white', severity: 'today' };
    if (diffDays <= 3) return { label: `H-${diffDays}`, color: 'bg-amber-500/90 text-gray-900', severity: 'soon' };
    return { label: dl.toLocaleDateString('en-GB',{ day:'2-digit', month:'2-digit'}), color: 'bg-gray-600/70 text-gray-100', severity: 'normal' };
  };

  // Bersihkan hoverIndex ketika drag selesai di mana pun (misal drop di luar zona)
  useEffect(() => {
    const handleDragEndGlobal = () => setHoverIndex(null);
    window.addEventListener('dragend', handleDragEndGlobal);
    window.addEventListener('drop', handleDragEndGlobal);
    return () => {
      window.removeEventListener('dragend', handleDragEndGlobal);
      window.removeEventListener('drop', handleDragEndGlobal);
    };
  }, []);

  const triggerDrop = useCallback(
    (e, idx) => {
      if (!canEdit || !draggedTask) return;
      e.preventDefault();
      handleDropOnTask?.(e, colId, idx);
      setHoverIndex(null);
    },
    [canEdit, draggedTask, colId, handleDropOnTask]
  );

  const handleZoneDragOver = (e, idx) => {
    if (!canEdit || !draggedTask) return;
    e.preventDefault();
    setHoverIndex(idx);
  };

  const renderDropZone = (idx) => {
    const active = hoverIndex === idx && draggedTask;
    // Dinamis: hitung estimasi baris judul & konten untuk tinggi ghost
    let estimatedHeight = 0;
    if (active && draggedTask) {
      const titleRaw = draggedTask.task.title || '(No Title)';
      const contentRaw = draggedTask.task.content || '';
      const titleCharsPerLine = 28; // lebih kecil agar aman wrap
      const contentCharsPerLine = 48;
      const maxTitleLines = 2;
      const maxContentLines = 5; // batasi agar drop zone tidak terlalu tinggi
      const titleLines = Math.min(maxTitleLines, Math.max(1, Math.ceil(titleRaw.length / titleCharsPerLine)));
      const estContentLines = contentRaw
        ? Math.min(maxContentLines, Math.max(1, Math.ceil(contentRaw.length / contentCharsPerLine)))
        : 0;
      // Tinggi kira-kira: padding + label + gap + lines
      const padding = 24; // px (atas + bawah)
      const labelHeight = 16; // 'Drop Position'
      const lineHeightTitle = 16; // px
      const lineHeightContent = 16; // px
      const gap = 6 * ( (contentRaw ? 1 : 0) + 1 );
      const deadlineHeight = draggedTask.task.deadline ? 18 : 0;
      estimatedHeight = padding + labelHeight + (titleLines * lineHeightTitle) + (estContentLines * lineHeightContent) + gap + deadlineHeight;
      // Minimal fallback
      if (estimatedHeight < 72) estimatedHeight = 72;
    } else {
      estimatedHeight = 6; // collapsed bar
    }

    // Siapkan preview potongan konten sesuai batas baris
    let previewTitle = '';
    let previewContent = '';
    if (active && draggedTask) {
      const t = draggedTask.task.title || '(No Title)';
      const c = draggedTask.task.content || '';
      const titleCharsPerLine = 28;
      const contentCharsPerLine = 53.5;
      const maxTitleLines = 2;
      const maxContentLines = 5;
      const maxTitleChars = titleCharsPerLine * maxTitleLines;
      const maxContentChars = contentCharsPerLine * maxContentLines;
      previewTitle = t.length > maxTitleChars ? t.slice(0, maxTitleChars - 3) + '...' : t;
      previewContent = c.length > maxContentChars ? c.slice(0, maxContentChars - 3) + '...' : c;
    }

    return (
      <div
        key={`dz-${idx}`}
        onDragOver={(e) => handleZoneDragOver(e, idx)}
        onDrop={(e) => triggerDrop(e, idx)}
        onDragEnter={(e) => handleZoneDragOver(e, idx)}
        className={`relative w-full select-none transition-all duration-150 ease-out
          ${draggedTask ? 'cursor-grabbing' : 'cursor-default'}`}
        style={{
          height: active ? estimatedHeight : 6,
          margin: active ? '4px 0 8px 0' : '0px 0 0px 0',
          borderRadius: active ? 10 : 8,
          backgroundColor: active ? 'rgba(59,130,246,0.10)' : 'transparent',
          border: active ? '2px solid rgba(147,197,253,0.9)' : '2px solid transparent',
          boxShadow: active ? '0 4px 10px -2px rgba(59,130,246,0.35)' : 'none'
        }}
      >
        {active && draggedTask && (
          <div className="absolute inset-0 flex flex-col pointer-events-none px-2 py-2 overflow-hidden">
            <div className="flex flex-col gap-1 bg-blue-500/10 border border-blue-300/60 rounded-md backdrop-blur-sm px-3 py-2 text-[11px] text-blue-100 h-full">
              <span className="uppercase tracking-wide font-semibold text-[10px] opacity-70">Drop Position</span>
              <span className="text-xsvtext-center font-medium break-anywhere leading-snug">{previewTitle}</span>
              {previewContent && (
                <span className="text-[10px] text-blue-200 leading-snug whitespace-pre-line break-anywhere">{previewContent}</span>
              )}
              {draggedTask.task.deadline && (
                <span className="text-[10px] mt-1 inline-block bg-blue-400/30 px-2 py-0.5 rounded-full w-fit">{getDeadlineStatus(draggedTask.task.deadline)?.label}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (ordered.length === 0) {
    return (
      <div
        className={`rounded-md border-2 border-dashed p-4 text-center text-sm text-gray-400 transition-colors
        ${draggedTask ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600'}`}
        onDragOver={(e) => handleZoneDragOver(e, 0)}
        onDrop={(e) => triggerDrop(e, 0)}
      >
        {draggedTask ? 'Lepas untuk menambahkan ke kolom ini' : 'Belum ada task'}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Drop zone paling atas */}
      {renderDropZone(0)}
      {ordered.map((task, i) => {
        const isDraggingCard = draggedTask && draggedTask.task.id === task.id;
        const isEditing = editingTaskId === task.id;
        const deadlineInfo = getDeadlineStatus(task.deadline);
        return (
          <div key={task.id} className="flex flex-col">
            <div
              draggable={canEdit && !isEditing}
              onDragStart={() => canEdit && !isEditing && handleDragStartTask(task, colId)}
              className={`bg-gray-700 text-white p-3 rounded-md shadow-sm mb-1 transition-all duration-150 group
                ${canEdit && !isEditing ? 'cursor-move hover:bg-gray-600' : 'cursor-default'}
                ${isDraggingCard ? 'opacity-50 scale-[0.97]' : 'opacity-100'}
              ${isEditing ? 'ring-2 ring-lime-400' : ''}`}
              style={{
                userSelect: 'none',
                transform: isDraggingCard ? 'scale(0.97)' : 'none',
              }}
            >
              {isEditing ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!draft.title.trim()) return;
                    setSaving(true);
                    const ok = await handleUpdateTask(task.id, { title: draft.title.trim(), content: draft.content.trim(), deadline: draft.deadline || null });
                    setSaving(false);
                    if (ok) setEditingTaskId(null);
                  }}
                >
                  <input
                    className="w-full px-2 py-1 rounded bg-gray-800 text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingTaskId(null);
                      }
                    }}
                    placeholder="Judul"
                  />
                  <textarea
                    className="w-full px-2 py-1 rounded bg-gray-800 text-xs border border-gray-600 resize-none h-20 leading-snug focus:outline-none focus:ring-1 focus:ring-lime-400 break-anywhere"
                    value={draft.content}
                    onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                    placeholder="Deskripsi"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="px-2 py-1 rounded bg-gray-800 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
                      value={draft.deadline || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
                    />
                    {draft.deadline && (
                      <button
                        type="button"
                        className="text-[10px] text-gray-300 hover:text-red-300"
                        onClick={() => setDraft((d) => ({ ...d, deadline: '' }))}
                      >Reset</button>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
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
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start">
                    <span
                      className="text-sm leading-snug break-words flex-1 text-left"
                      onDoubleClick={() => {
                        if (!canEdit) return;
                        setEditingTaskId(task.id);
                        setDraft({ title: task.title || task.content || '', content: task.content || '', deadline: task.deadline || '' });
                      }}
                    >
                      {task.title ? (
                        <>
                          <span className="font-semibold block mb-1 leading-tight break-anywhere">
                            {task.title}
                          </span>
                          {task.content && (
                            <>
                              <span
                                ref={makeMeasureRef(task.id)}
                                className={`text-[11px] text-gray-300 whitespace-pre-line leading-snug break-anywhere block transition-all ${truncatedDesc[task.id] && !expandedDesc[task.id] ? 'clamped-5-lines' : ''}`}
                              >
                                {task.content}
                              </span>
                              { (truncatedDesc[task.id] || expandedDesc[task.id]) && (
                                <button
                                  type="button"
                                  onClick={() => toggleDesc(task.id)}
                                  className="mt-1 text-[10px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
                                >
                                  {expandedDesc[task.id] ? 'Sembunyikan' : 'Lihat selengkapnya'}
                                </button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <span
                            ref={makeMeasureRef(task.id)}
                            className={`text-[11px] text-gray-300 whitespace-pre-line leading-snug break-anywhere block transition-all ${truncatedDesc[task.id] && !expandedDesc[task.id] ? 'clamped-5-lines' : ''}`}
                          >
                            {task.content}
                          </span>
                          { (truncatedDesc[task.id] || expandedDesc[task.id]) && (
                            <button
                              type="button"
                              onClick={() => toggleDesc(task.id)}
                              className="mt-1 text-[10px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
                            >
                              {expandedDesc[task.id] ? 'Sembunyikan' : 'Lihat selengkapnya'}
                            </button>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  {quickDeadlineTaskId === task.id && canEdit && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setQuickSaving(true);
                        const ok = await handleUpdateTask(task.id, { deadline: quickDeadlineValue || null });
                        setQuickSaving(false);
                        if (ok) {
                          setQuickDeadlineTaskId(null);
                          setQuickDeadlineValue('');
                        }
                      }}
                      className="flex items-center gap-2 bg-gray-800/70 px-2 py-2 rounded-md border border-gray-600"
                    >
                      <input
                        type="date"
                        className="px-2 py-1 rounded bg-gray-900 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400 text-white"
                        value={quickDeadlineValue}
                        onChange={(e) => setQuickDeadlineValue(e.target.value)}
                      />
                      {quickDeadlineValue && (
                        <button
                          type="button"
                          className="text-[10px] text-gray-300 hover:text-red-300"
                          onClick={() => setQuickDeadlineValue('')}
                        >Clear</button>
                      )}
                      <button
                        type="submit"
                        disabled={quickSaving}
                        className="ml-auto text-[11px] font-semibold bg-lime-600 hover:bg-lime-700 disabled:opacity-50 px-3 py-1 rounded text-white"
                      >{quickSaving ? '...' : 'Save'}</button>
                    </form>
                  )}
                  {(deadlineInfo || canEdit) && (
                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-600/40">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {deadlineInfo && (
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${deadlineInfo.color} ${['today','overdue'].includes(deadlineInfo.severity) ? 'deadline-badge-urgent' : ''}`}>{deadlineInfo.label}</span>
                        )}
                        {deadlineInfo?.severity === 'overdue' && (
                          <span className="text-[10px] text-red-400 italic truncate">Lewat deadline</span>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (quickDeadlineTaskId === task.id) {
                                setQuickDeadlineTaskId(null);
                                setQuickDeadlineValue('');
                              } else {
                                setQuickDeadlineTaskId(task.id);
                                setQuickDeadlineValue(task.deadline || '');
                              }
                            }}
                            className="px-2 py-1 rounded bg-gray-600/40 hover:bg-gray-600/70 text-amber-300 hover:text-amber-200 text-[11px] flex items-center gap-1"
                            title={task.deadline ? 'Ubah deadline' : 'Set deadline'}
                            type="button"
                          >
                            {quickDeadlineTaskId === task.id ? <FiX className="w-4 h-4" /> : <FiCalendar className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setDraft({ title: task.title || task.content || '', content: task.content || '', deadline: task.deadline || '' });
                            }}
                            className="px-2 py-1 rounded bg-gray-600/40 hover:bg-gray-600/70 text-blue-300 hover:text-blue-200 text-[11px] flex items-center gap-1"
                            title="Edit"
                            type="button"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="px-2 py-1 rounded bg-gray-600/40 hover:bg-gray-600/70 text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1"
                            aria-label="Delete task"
                            type="button"
                            title="Hapus"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {renderDropZone(i + 1)}
          </div>
        );
      })}
    </div>
  );
}
