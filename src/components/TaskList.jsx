import React, { useState, useCallback, useEffect, useMemo } from "react";
import TaskCard from "./TaskCard";
import TaskEditForm from "./TaskEditForm";
import DropZone from "./DropZone";
import { getOrderedTasks, isTaskBeingDragged } from "../lib/taskUtils";
import { useDescriptionManagement } from "../hooks/useDescriptionManagement";
import { useTaskEditing } from "../hooks/useTaskEditing";

/**
 * TaskList component - Manages task display, editing, and drag-drop functionality
 *
 * @param {Array} tasks - Array of all tasks
 * @param {string} colId - Column ID to filter tasks
 * @param {boolean} canEdit - Whether user can edit tasks
 * @param {Object} draggedTask - Currently dragged task object
 * @param {Function} handleDragStartTask - Handle drag start
 * @param {Function} handleDeleteTask - Handle task deletion
 * @param {Function} handleDropOnTask - Handle task drop
 * @param {Function} handleUpdateTask - Handle task update
 */
export default function TaskList({
  tasks,
  colId,
  canEdit,
  draggedTask,
  handleDragStartTask,
  handleDeleteTask,
  handleDropOnTask,
  handleUpdateTask,
  // New props for assignment
  boardMembers,
  onAssignTask,
  currentUserId,
}) {
  // Use custom hooks for better organization
  const { expandedDesc, truncatedDesc, toggleDesc, makeMeasureRef } =
    useDescriptionManagement();
  const {
    editingTaskId,
    draft,
    setDraft,
    saving,
    startEditTask,
    cancelEdit,
    submitEdit,
  } = useTaskEditing(canEdit, handleUpdateTask);

  // Memoized filtered and sorted tasks
  const ordered = useMemo(() => getOrderedTasks(tasks, colId), [tasks, colId]);

  const [hoverIndex, setHoverIndex] = useState(null); // posisi drop sementara

  // Bersihkan hoverIndex ketika drag selesai di mana pun (misal drop di luar zona)
  useEffect(() => {
    const handleDragEndGlobal = () => setHoverIndex(null);
    window.addEventListener("dragend", handleDragEndGlobal);
    window.addEventListener("drop", handleDragEndGlobal);
    return () => {
      window.removeEventListener("dragend", handleDragEndGlobal);
      window.removeEventListener("drop", handleDragEndGlobal);
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

  const handleZoneDragOver = useCallback(
    (e, idx) => {
      if (!canEdit || !draggedTask) return;
      e.preventDefault();
      setHoverIndex(idx);
    },
    [canEdit, draggedTask]
  );

  const renderDropZone = useCallback(
    (idx) => {
      const active = hoverIndex === idx && draggedTask;

      return (
        <DropZone
          idx={idx}
          active={active}
          draggedTask={draggedTask}
          onDragOver={handleZoneDragOver}
          onDrop={triggerDrop}
          onDragEnter={handleZoneDragOver}
        />
      );
    },
    [hoverIndex, draggedTask, handleZoneDragOver, triggerDrop]
  );

  if (ordered.length === 0) {
    return (
      <div
        className={`rounded-md border-2 border-dashed p-4 text-center text-sm text-gray-400 transition-colors
        ${draggedTask ? "border-blue-400 bg-blue-500/10" : "border-gray-600"}`}
        onDragOver={(e) => handleZoneDragOver(e, 0)}
        onDrop={(e) => triggerDrop(e, 0)}
      >
        {draggedTask
          ? "Lepas untuk menambahkan ke kolom ini"
          : "Belum ada task"}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Drop zone paling atas */}
      {renderDropZone(0)}
      {ordered.map((task, i) => {
        const isDraggingCard = isTaskBeingDragged(draggedTask, task.id);
        const isEditing = editingTaskId === task.id;

        return (
          <div key={task.id} className="flex flex-col">
            {isEditing ? (
              <TaskEditForm
                task={task}
                draft={draft}
                setDraft={setDraft}
                saving={saving}
                onSubmit={submitEdit}
                onCancel={cancelEdit}
              />
            ) : (
              <TaskCard
                task={task}
                canEdit={canEdit}
                draggedTask={draggedTask}
                isDraggingCard={isDraggingCard}
                onDragStart={(t) => handleDragStartTask(t, colId)}
                onStartEdit={startEditTask}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
                expandedDesc={expandedDesc}
                truncatedDesc={truncatedDesc}
                makeMeasureRef={makeMeasureRef}
                toggleDesc={toggleDesc}
                // New props for assignment
                boardMembers={boardMembers}
                onAssignTask={onAssignTask}
                currentUserId={currentUserId}
              />
            )}
            {renderDropZone(i + 1)}
          </div>
        );
      })}
    </div>
  );
}
