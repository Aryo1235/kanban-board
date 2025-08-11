import React from "react";
import TaskList from "./TaskList";

export default function Column({
  col,
  tasks,
  idx,
  canEdit,
  isViewer,
  role,
  draggedTask,
  handleDragOverTask,
  handleDropTask,
  handleDragStartTask,
  handleDeleteTask,
  handleDeleteColumn,
  handleAddTask,
  newTask,
  setNewTask,
  addingTask,
  toast,
}) {
  // Daftar warna kolom (bisa diimpor dari util jika ingin)
  const columnColorList = [
    {
      header: "bg-gradient-to-r from-sky-500 to-sky-700",
      border: "border-sky-500",
    },
    {
      header: "bg-gradient-to-r from-amber-500 to-amber-700",
      border: "border-amber-500",
    },
    {
      header: "bg-gradient-to-r from-emerald-500 to-emerald-700",
      border: "border-emerald-500",
    },
    {
      header: "bg-gradient-to-r from-pink-500 to-pink-700",
      border: "border-pink-500",
    },
    {
      header: "bg-gradient-to-r from-indigo-500 to-indigo-700",
      border: "border-indigo-500",
    },
    {
      header: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-700",
      border: "border-fuchsia-500",
    },
    {
      header: "bg-gradient-to-r from-lime-500 to-lime-700",
      border: "border-lime-500",
    },
    {
      header: "bg-gradient-to-r from-cyan-500 to-cyan-700",
      border: "border-cyan-500",
    },
  ];
  const style =
    col.colorIndex !== undefined &&
    col.colorIndex !== null &&
    columnColorList[col.colorIndex]
      ? columnColorList[col.colorIndex]
      : columnColorList[idx % columnColorList.length];

  return (
    <div
      className={`flex-shrink-0 w-80 p-3 bg-gray-800 rounded-lg border-t-4 min-h-40 ${style.border}`}
      onDragOver={handleDragOverTask}
      onDrop={(e) => handleDropTask(e, col.id)}
    >
      <div
        className={`p-4 text-white font-bold text-xl mb-4 rounded-t-md flex justify-between items-center ${style.header}`}
      >
        <span className="ml-4 bg-gray-900 rounded-full px-2 py-1 text-sm bg-opacity-30">
          {tasks.length}
        </span>
        <span>{col.name}</span>
        <button
          className="text-red-400 hover:text-red-300 text-sm ml-2 cursor-pointer"
          title="Hapus kolom"
          onClick={() => {
            if (!canEdit) {
              toast.error("Hanya owner/editor yang bisa menghapus kolom.");
              return;
            }
            handleDeleteColumn(col.id);
          }}
        >
          🗑️
        </button>
      </div>
      <form
        onSubmit={(e) => handleAddTask(e, col.id)}
        className="mb-3 flex gap-2"
      >
        <input
          type="text"
          className="p-2 rounded bg-gray-700 text-white border border-gray-600 flex-1"
          placeholder="Tambah task"
          value={newTask[col.id] || ""}
          onChange={(e) =>
            setNewTask((t) => ({ ...t, [col.id]: e.target.value }))
          }
          disabled={addingTask[col.id]}
        />
        <button
          type="submit"
          className="bg-lime-600 hover:bg-lime-700 px-3 py-2 rounded text-white font-bold"
          disabled={addingTask[col.id]}
          onClick={(e) => {
            if (!canEdit) {
              e.preventDefault();
              toast.error("Hanya owner/editor yang bisa menambah task.");
            }
          }}
        >
          {addingTask[col.id] ? "..." : "+"}
        </button>
      </form>
      <TaskList
        tasks={tasks}
        colId={col.id}
        canEdit={canEdit}
        isViewer={isViewer}
        role={role}
        draggedTask={draggedTask}
        handleDragStartTask={handleDragStartTask}
        handleDeleteTask={handleDeleteTask}
        toast={toast}
      />
    </div>
  );
}
