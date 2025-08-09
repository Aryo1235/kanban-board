import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

// Daftar warna kolom (bukan abu-abu)
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
export default function BoardDetail() {
  const { id } = useParams();
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newColumn, setNewColumn] = useState("");
  const [newTask, setNewTask] = useState({}); // { [columnId]: "" }
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingTask, setAddingTask] = useState({}); // { [columnId]: false }
  const [role, setRole] = useState("");
  // Drag & drop state
  const [draggedTask, setDraggedTask] = useState(null); // { task, fromColumnId }
  // Handler untuk drag & drop task antar kolom
  const canEdit = role === "owner" || role === "editor";
  const isViewer = role === "viewer";
  // Untuk mencegah spam toast saat drag
  const [dragToastShown, setDragToastShown] = useState(false);

  const handleDragStartTask = (task, fromColumnId) => {
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa memindahkan task.");
      setDragToastShown(true);
      return;
    }
    setDraggedTask({ task, fromColumnId });
    setDragToastShown(false);
  };

  const handleDragOverTask = (e) => {
    if (!canEdit) {
      // Tidak perlu toast di dragOver agar tidak spam
      return;
    }
    e.preventDefault();
  };

  const handleDropTask = async (e, toColumnId) => {
    if (!canEdit) {
      // Tidak perlu toast di drop agar tidak spam
      setDragToastShown(false); // reset agar drag berikutnya bisa munculkan toast lagi
      return;
    }
    e.preventDefault();
    if (!draggedTask) return;
    const { task, fromColumnId } = draggedTask;
    if (fromColumnId === toColumnId) return setDraggedTask(null);
    setError("");
    // Hitung posisi baru di kolom tujuan
    const colTasks = tasks.filter((t) => t.column_id === toColumnId);
    const newPosition =
      colTasks.length > 0
        ? Math.max(...colTasks.map((t) => t.position || 0)) + 1
        : 1;
    // Update task di Supabase
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ column_id: toColumnId, position: newPosition })
      .eq("id", task.id);
    if (updateError) setError(updateError.message);
    setDraggedTask(null);
    setDragToastShown(false);
    fetchData();
  };

  // Handler hapus task
  const handleDeleteTask = async (taskId) => {
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menghapus task.");
      return;
    }
    if (!window.confirm("Hapus task ini?")) return;
    setError("");
    const { error: delError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);
    if (delError) setError(delError.message);
    fetchData();
  };

  // Mendapatkan style kolom berdasarkan colorIndex atau urutan
  const getColumnStyle = (col, idx) => {
    // Jika ada colorIndex, pakai itu
    if (
      col.colorIndex !== undefined &&
      col.colorIndex !== null &&
      columnColorList[col.colorIndex]
    ) {
      return columnColorList[col.colorIndex];
    }
    // Jika tidak ada, pakai urutan index map
    return columnColorList[idx % columnColorList.length];
  };

  // loading hanya untuk load pertama kali
  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");
    // Fetch board info
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("id", id)
      .single();
    if (boardError) {
      setError(boardError.message);
      setLoading(false);
      return;
    }
    setBoard(boardData);
    // Cek role user di board ini
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setRole("");
    } else if (boardData.user_id === userData.user.id) {
      setRole("owner");
    } else {
      // cek di board_members
      const { data: member, error: memberError } = await supabase
        .from("board_members")
        .select("role")
        .eq("board_id", id)
        .eq("user_id", userData.user.id)
        .single();
      if (memberError || !member) {
        setRole("");
      } else {
        setRole(member.role);
      }
    }
    // Fetch columns
    const { data: columnsData, error: columnsError } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", id)
      .order("position", { ascending: true });
    if (columnsError) {
      setError(columnsError.message);
      setLoading(false);
      return;
    }
    setColumns(columnsData || []);
    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .in(
        "column_id",
        columnsData.map((col) => col.id)
      )
      .order("position", { ascending: true });
    if (tasksError) {
      setError(tasksError.message);
      setLoading(false);
      return;
    }
    setTasks(tasksData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line
  }, [id]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menambah kolom.");
      return;
    }
    if (!newColumn.trim()) return;
    setAddingColumn(true);
    setError("");
    const maxPos =
      columns.length > 0 ? Math.max(...columns.map((c) => c.position || 0)) : 0;
    // Pilih warna acak yang belum dipakai
    let usedIndexes = columns
      .map((c) => c.colorIndex)
      .filter((idx) => idx !== undefined && idx !== null);
    let availableIndexes = columnColorList
      .map((_, idx) => idx)
      .filter((idx) => !usedIndexes.includes(idx));
    let colorIndex =
      availableIndexes.length > 0
        ? availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
        : Math.floor(Math.random() * columnColorList.length);
    const { error: insertError } = await supabase
      .from("columns")
      .insert([
        { name: newColumn, board_id: id, position: maxPos + 1, colorIndex },
      ]);
    if (insertError) setError(insertError.message);
    setNewColumn("");
    setAddingColumn(false);
    fetchData();
  };

  const handleDeleteColumn = async (columnId) => {
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menghapus kolom.");
      return;
    }
    if (!window.confirm("Hapus kolom beserta semua task di dalamnya?")) return;
    setError("");
    // Hapus semua task di kolom ini
    await supabase.from("tasks").delete().eq("column_id", columnId);
    // Hapus kolom
    const { error: delError } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);
    if (delError) setError(delError.message);
    fetchData();
  };

  const handleAddTask = async (e, columnId) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menambah task.");
      return;
    }
    if (!newTask[columnId] || !newTask[columnId].trim()) return;
    setAddingTask((t) => ({ ...t, [columnId]: true }));
    setError("");
    const colTasks = tasks.filter((t) => t.column_id === columnId);
    const maxPos =
      colTasks.length > 0
        ? Math.max(...colTasks.map((t) => t.position || 0))
        : 0;
    const { error: insertError } = await supabase.from("tasks").insert([
      {
        content: newTask[columnId],
        column_id: columnId,
        position: maxPos + 1,
      },
    ]);
    if (insertError) setError(insertError.message);
    setNewTask((t) => ({ ...t, [columnId]: "" }));
    setAddingTask((t) => ({ ...t, [columnId]: false }));
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    );
  }
  if (error) return <div className="text-red-400 p-8">{error}</div>;
  if (!board)
    return <div className="text-gray-400 p-8">Board tidak ditemukan.</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen flex justify-center items-center">
      <div className=" w-full flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-yellow-400 via-pink-400 mb-8">
          {board.name}
        </h2>
        <form
          onSubmit={handleAddColumn}
          className="mb-8 flex max-w-lg w-full overflow-hidden "
        >
          <input
            type="text"
            className="flex-grow p-3 bg-gray-800 border border-gray-700 border-r-0 rounded-l text-white"
            placeholder="Tambah kolom (misal: To Do)"
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            disabled={addingColumn}
          />
          <button
            type="submit"
            className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 transition-colors cursor-pointer ml-2"
            disabled={addingColumn}
            onClick={(e) => {
              if (!canEdit) {
                e.preventDefault();
                toast.error("Hanya owner/editor yang bisa menambah kolom.");
              }
            }}
          >
            Tambah Kolom
          </button>
        </form>
        <div className="flex gap-6 overflow-x-auto pb-6 w-full justify-center items-start">
          {columns.map((col, idx) => {
            const style = getColumnStyle(col, idx);
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-80 p-3 bg-gray-800 rounded-lg border-t-4 min-h-40 ${style.border}`}
                onDragOver={handleDragOverTask}
                onDrop={(e) => handleDropTask(e, col.id)}
              >
                <div
                  className={`p-4 text-white font-bold text-xl mb-4 rounded-t-md flex justify-between items-center ${style.header}`}
                >
                  <span className="ml-4 bg-gray-900 rounded-full px-2 py-1 text-sm bg-opacity-30">
                    {tasks.filter((t) => t.column_id === col.id).length}
                  </span>
                  <span>{col.name}</span>
                  <button
                    className="text-red-400 hover:text-red-300 text-sm ml-2 cursor-pointer"
                    title="Hapus kolom"
                    onClick={() => {
                      if (!canEdit) {
                        toast.error(
                          "Hanya owner/editor yang bisa menghapus kolom."
                        );
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
                        toast.error(
                          "Hanya owner/editor yang bisa menambah task."
                        );
                      }
                    }}
                  >
                    {addingTask[col.id] ? "..." : "+"}
                  </button>
                </form>
                <div className="space-y-2">
                  {tasks.filter((t) => t.column_id === col.id).length === 0 && (
                    <div className="text-gray-500 text-center p-3">
                      No tasks available
                    </div>
                  )}
                  {tasks
                    .filter((t) => t.column_id === col.id)
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStartTask(task, col.id)}
                        className="bg-gray-700 text-white p-3 rounded-md cursor-move hover:bg-gray-600 transition-colors"
                        style={{
                          opacity:
                            draggedTask && draggedTask.task.id === task.id
                              ? 0.5
                              : 1,
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
