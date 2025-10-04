import React, { useState, useEffect } from "react";
import { FiTrash2, FiEdit2, FiX, FiSave, FiPlus } from "react-icons/fi";
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
  handleUpdateTask,
  handleUpdateColumn,
  newTask,
  setNewTask,
  addingTask,
  toast,
}) {
  console.log(role, canEdit, isViewer);
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

  // Toggle form tambah task per kolom
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(false); // untuk validasi title kosong

  // Jika state newTask kolom ini direset (berhasil tambah), kita bisa otomatis tutup form
  useEffect(() => {
    if (showAddForm) {
      const nt = newTask[col.id];
      if (nt && nt.title === "" && nt.content === "") {
        setShowAddForm(false);
      }
    }
  }, [newTask[col.id]]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isHighlight, setIsHighlight] = useState(false);
  const [editingColumn, setEditingColumn] = useState(false);
  const [columnNameDraft, setColumnNameDraft] = useState(col.name);

  // Reset highlight jika drag dibatalkan / task selesai dipindah
  useEffect(() => {
    if (!draggedTask) {
      setIsHighlight(false);
    }
  }, [draggedTask]);

  const handleDragEnterColumn = (e) => {
    if (draggedTask && draggedTask.fromColumnId !== col.id) {
      setIsHighlight(true);
    }
  };
  const handleDragLeaveColumn = (e) => {
    // Hanya hilangkan highlight jika benar-benar keluar dari boundary column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsHighlight(false);
    }
  };
  const handleDragEndColumn = () => {
    setIsHighlight(false);
  };

  return (
    <div
      className={`flex-shrink-0 w-[350px] p-3 rounded-lg border-t-4 min-h-40 transition-colors ${
        style.border
      } ${
        isHighlight ? "bg-gray-800/70 ring-2 ring-sky-500/40" : "bg-gray-800"
      }`}
      onDragOver={handleDragOverTask}
      onDragEnter={handleDragEnterColumn}
      onDragLeave={handleDragLeaveColumn}
      // Tidak ada onDrop di container agar hanya drop zone spesifik yang valid
      onDragEnd={handleDragEndColumn}
    >
      <div
        className={`p-3 pr-2 text-white font-bold text-sm mb-4 rounded-t-md flex items-center gap-2 ${style.header}`}
      >
        <span className="bg-gray-900/40 rounded-full px-2 py-0.5 text-[11px] font-medium">
          {tasks.length}
        </span>
        {editingColumn ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!columnNameDraft.trim()) return;
              const ok = await handleUpdateColumn(col.id, {
                name: columnNameDraft.trim(),
              });
              if (ok) setEditingColumn(false);
            }}
            className="flex items-center gap-2 flex-1"
          >
            <input
              className="flex-1 px-2 py-1 rounded text-xs bg-gray-900/60 border border-white/20 focus:outline-none focus:ring-1 focus:ring-lime-400 text-white"
              value={columnNameDraft}
              onChange={(e) => setColumnNameDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditingColumn(false);
                  setColumnNameDraft(col.name);
                }
              }}
            />
            <button
              type="submit"
              className="p-1 rounded bg-lime-500/80 hover:bg-lime-500 text-white"
              title="Simpan"
            >
              <FiSave className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded bg-gray-600/70 hover:bg-gray-500 text-white"
              title="Batal"
              onClick={() => {
                setEditingColumn(false);
                setColumnNameDraft(col.name);
              }}
            >
              <FiX className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="truncate text-sm font-semibold select-none"
              title={col.name}
            >
              {col.name}
            </span>
            {canEdit && (
              <div className="flex items-center gap-1 ml-auto opacity-80 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setEditingColumn(true)}
                  className="p-1 rounded hover:bg-gray-900/30"
                  title="Edit kolom"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!canEdit) {
                      toast.error("Tidak boleh");
                      return;
                    }
                    if (
                      window.confirm("Hapus kolom beserta task di dalamnya?")
                    ) {
                      handleDeleteColumn(col.id);
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-900/30 text-red-300 hover:text-red-200"
                  title="Hapus kolom"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {showAddForm ? (
        <form
          onSubmit={async (e) => {
            setSubmitAttempt(true);
            const ok = await handleAddTask(e, col.id);
            if (!ok) {
              // tetap buka form jika gagal
            } else {
              setSubmitAttempt(false);
            }
          }}
          className="mb-3 flex flex-col gap-2"
        >
          {(() => {
            const data = newTask[col.id] || {
              title: "",
              content: "",
              deadline: "",
            };
            const titleEmpty = submitAttempt && !data.title.trim();
            return (
              <>
                <input
                  type="text"
                  className={`p-2 rounded bg-gray-700 text-white border w-full text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-lime-400 transition-colors ${
                    titleEmpty
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-600"
                  }`}
                  placeholder="Judul task (wajib)"
                  value={data.title}
                  onChange={(e) =>
                    setNewTask((t) => ({
                      ...t,
                      [col.id]: {
                        ...(t[col.id] || {
                          title: "",
                          content: "",
                          deadline: "",
                        }),
                        title: e.target.value,
                      },
                    }))
                  }
                  disabled={addingTask[col.id]}
                  autoFocus
                />
                {titleEmpty && (
                  <span className="text-[11px] text-red-400 -mt-1">
                    Judul wajib diisi.
                  </span>
                )}
                <textarea
                  className="p-2 rounded bg-gray-700 text-white border border-gray-600 w-full resize-none text-xs leading-snug focus:outline-none focus:ring-1 focus:ring-lime-400"
                  placeholder="Deskripsi (opsional)"
                  rows={2}
                  value={data.content}
                  onChange={(e) =>
                    setNewTask((t) => ({
                      ...t,
                      [col.id]: {
                        ...(t[col.id] || {
                          title: "",
                          content: "",
                          deadline: "",
                        }),
                        content: e.target.value,
                      },
                    }))
                  }
                  disabled={addingTask[col.id]}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="p-2 rounded bg-gray-700 text-white border border-gray-600 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-lime-400"
                    value={data.deadline || ""}
                    onChange={(e) =>
                      setNewTask((t) => ({
                        ...t,
                        [col.id]: {
                          ...(t[col.id] || {
                            title: "",
                            content: "",
                            deadline: "",
                          }),
                          deadline: e.target.value,
                        },
                      }))
                    }
                    disabled={addingTask[col.id]}
                  />
                  {data.deadline && (
                    <button
                      type="button"
                      className="text-xs text-gray-300 hover:text-red-300"
                      onClick={() =>
                        setNewTask((t) => ({
                          ...t,
                          [col.id]: { ...(t[col.id] || {}), deadline: "" },
                        }))
                      }
                      disabled={addingTask[col.id]}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </>
            );
          })()}
          <div className="flex justify-between gap-2 mt-1">
            <button
              type="button"
              className="px-3 py-2 rounded bg-gray-600 text-white text-sm hover:bg-gray-500 disabled:opacity-50"
              onClick={() => {
                setShowAddForm(false);
                setSubmitAttempt(false);
                setNewTask((t) => ({
                  ...t,
                  [col.id]: { title: "", content: "", deadline: "" },
                }));
              }}
              disabled={addingTask[col.id]}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-lime-600 hover:bg-lime-700 px-3 py-2 rounded text-white font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={addingTask[col.id]}
              onClick={(e) => {
                if (!canEdit) {
                  e.preventDefault();
                  toast.error("Hanya owner/editor yang bisa menambah task.");
                }
              }}
            >
              {addingTask[col.id] ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      ) : (
        <button
          className="w-full mb-3 flex items-center justify-center gap-1 bg-gray-700/60 hover:bg-gray-600 text-white text-sm font-medium px-3 py-2 rounded border border-dashed border-gray-500 transition-colors"
          onClick={() => {
            if (!canEdit) {
              toast.error("Hanya owner/editor yang bisa menambah task.");
              return;
            }
            setNewTask((t) => ({
              ...t,
              [col.id]: t[col.id] || { title: "", content: "", deadline: "" },
            }));
            setShowAddForm(true);
          }}
        >
          <FiPlus className="w-4 h-4" /> Add Card
        </button>
      )}
      <TaskList
        tasks={tasks}
        colId={col.id}
        canEdit={canEdit}
        isViewer={isViewer}
        role={role}
        draggedTask={draggedTask}
        handleDragStartTask={handleDragStartTask}
        handleDeleteTask={handleDeleteTask}
        handleDropOnTask={handleDropTask}
        handleUpdateTask={handleUpdateTask}
        toast={toast}
      />
    </div>
  );
}
