import React from "react";

export default function TaskList({
  tasks,
  colId,
  canEdit,
  isViewer,
  role,
  draggedTask,
  handleDragStartTask,
  handleDeleteTask,
  toast,
}) {
  const filteredTasks = tasks.filter((t) => t.column_id === colId);
  return (
    <div className="space-y-2">
      {filteredTasks.length === 0 && (
        <div className="text-gray-500 text-center p-3">No tasks available</div>
      )}
      {filteredTasks.map((task) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => handleDragStartTask(task, colId)}
          className="bg-gray-700 text-white p-3 rounded-md cursor-move hover:bg-gray-600 transition-colors"
          style={{
            opacity: draggedTask && draggedTask.task.id === task.id ? 0.5 : 1,
          }}
        >
          <div className="flex justify-between items-center">
            <span>{task.content}</span>
            {canEdit && (
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-400 hover:text-red-300 ml-2 cursor-pointer"
                aria-label="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
