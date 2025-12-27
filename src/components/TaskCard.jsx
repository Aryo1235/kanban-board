import React, { useState } from "react";
import { FiTrash2, FiEdit2, FiCalendar, FiX } from "react-icons/fi";
import { getDeadlineStatus } from "../lib/deadline";
import TaskAssignmentDropdown from "./TaskAssignmentDropdown";

/**
 * TaskCard component - handles individual task display and quick actions
 */
export default function TaskCard({
  task,
  canEdit,
  draggedTask,
  isDraggingCard,
  onDragStart,
  onStartEdit,
  onDelete,
  onUpdate,
  expandedDesc,
  truncatedDesc,
  makeMeasureRef,
  toggleDesc,
  // New props for assignment
  boardMembers,
  onAssignTask,
  currentUserId,
}) {
  const [quickDeadlineTaskId, setQuickDeadlineTaskId] = useState(null);
  const [quickDeadlineValue, setQuickDeadlineValue] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  const deadlineInfo = getDeadlineStatus(task.deadline);
  const isEditing = false; // TaskCard only handles non-editing state

  const handleQuickDeadlineSubmit = async (e) => {
    e.preventDefault();
    setQuickSaving(true);
    const ok = await onUpdate(task.id, {
      deadline: quickDeadlineValue || null,
    });
    setQuickSaving(false);
    if (ok) {
      setQuickDeadlineTaskId(null);
      setQuickDeadlineValue("");
    }
  };

  const handleQuickDeadlineToggle = () => {
    if (quickDeadlineTaskId === task.id) {
      setQuickDeadlineTaskId(null);
      setQuickDeadlineValue("");
    } else {
      setQuickDeadlineTaskId(task.id);
      setQuickDeadlineValue(task.deadline || "");
    }
  };

  const renderDescription = () => {
    if (!task.content) return null;
    const truncated = truncatedDesc[task.id] && !expandedDesc[task.id];

    return (
      <>
        <span
          ref={makeMeasureRef(task.id)}
          className={`text-[11px] text-gray-300 whitespace-pre-line leading-snug break-anywhere block transition-all ${
            truncated ? "clamped-5-lines" : ""
          }`}
        >
          {task.content}
        </span>
        {(truncatedDesc[task.id] || expandedDesc[task.id]) && (
          <button
            type="button"
            onClick={() => toggleDesc(task.id)}
            className="mt-1 text-[10px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
          >
            {expandedDesc[task.id] ? "Sembunyikan" : "Lihat selengkapnya"}
          </button>
        )}
      </>
    );
  };

  return (
    <div
      draggable={canEdit && !isEditing}
      onDragStart={() => canEdit && !isEditing && onDragStart(task)}
      className={`bg-gray-700 text-white p-3 rounded-md shadow-sm mb-1 transition-all duration-150 group
        ${
          canEdit && !isEditing
            ? "cursor-move hover:bg-gray-600"
            : "cursor-default"
        }
        ${isDraggingCard ? "opacity-50 scale-[0.97]" : "opacity-100"}`}
      style={{
        userSelect: "none",
        transform: isDraggingCard ? "scale(0.97)" : "none",
      }}
    >
      <div className="flex flex-col gap-2">
        {/* Header: Title dan Assignment Button */}
        <div className="flex items-start justify-between gap-2 min-h-[24px]">
          <div
            className="text-sm font-semibold leading-tight break-words flex-1 text-left"
            onDoubleClick={() => onStartEdit(task)}
          >
            {task.title}
          </div>

          {/* Assignment button di kanan atas */}
          <div className="flex-shrink-0">
            <TaskAssignmentDropdown
              task={task}
              boardMembers={boardMembers}
              onAssign={onAssignTask}
              canEdit={canEdit}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        {/* Deskripsi di bawah title */}
        {task.content && (
          <div
            className="text-sm leading-snug break-words text-left"
            onDoubleClick={() => onStartEdit(task)}
          >
            {renderDescription()}
          </div>
        )}

        {/* Quick deadline form */}
        {quickDeadlineTaskId === task.id && canEdit && (
          <form
            onSubmit={handleQuickDeadlineSubmit}
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
                onClick={() => setQuickDeadlineValue("")}
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={quickSaving}
              className="ml-auto text-[11px] font-semibold bg-lime-600 hover:bg-lime-700 disabled:opacity-50 px-3 py-1 rounded text-white"
            >
              {quickSaving ? "..." : "Save"}
            </button>
          </form>
        )}

        {/* Footer with deadline info and action buttons */}
        {(deadlineInfo || canEdit) && (
          <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-600/40">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {deadlineInfo && (
                <span
                  className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                    deadlineInfo.color
                  } ${
                    ["today", "overdue"].includes(deadlineInfo.severity)
                      ? "deadline-badge-urgent"
                      : ""
                  }`}
                >
                  {deadlineInfo.label}
                </span>
              )}
              {deadlineInfo?.severity === "overdue" && (
                <span className="text-[10px] text-red-400 italic truncate">
                  Lewat deadline
                </span>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleQuickDeadlineToggle}
                  className="px-2 py-1 rounded bg-gray-600/40 hover:bg-gray-600/70 text-amber-300 hover:text-amber-200 text-[11px] flex items-center gap-1"
                  title={task.deadline ? "Ubah deadline" : "Set deadline"}
                  type="button"
                >
                  {quickDeadlineTaskId === task.id ? (
                    <FiX className="w-4 h-4" />
                  ) : (
                    <FiCalendar className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onStartEdit(task)}
                  className="px-2 py-1 rounded bg-gray-600/40 hover:bg-gray-600/70 text-blue-300 hover:text-blue-200 text-[11px] flex items-center gap-1"
                  title="Edit"
                  type="button"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
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
    </div>
  );
}
