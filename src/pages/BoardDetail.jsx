import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import BoardInvite from "../components/BoardInvite";
import Column from "../components/Column";
import useBoardInvite from "../hooks/useBoardInvite";
import { columnColorList } from "../lib/constant/columnColors";
import { useBoardData } from "../hooks/useBoardData";
import { useBoardRealtime } from "../hooks/useBoardRealtime";
import { useTaskDrag } from "../hooks/useTaskDrag";

export default function BoardDetail() {
  const { id } = useParams();
  const {
    board,
    columns,
    tasks,
    role,
    loading,
    error,
    setColumns,
    setTasks,
    setRole,
    refetch,
  } = useBoardData(id);

  const [newColumn, setNewColumn] = useState("");
  const [newTask, setNewTask] = useState({});
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingTask, setAddingTask] = useState({});
  const [userId, setUserId] = useState(null);

  const {
    members,
    loading: membersLoading,
    error: membersError,
    fetchMembers,
    inviteMember,
    updateRole,
    removeMember,
  } = useBoardInvite(id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  const canEdit = role === "owner" || role === "editor";
  const isViewer = role === "viewer";

  const {
    draggedTask,
    handleDragStartTask,
    handleDragOverTask,
    handleDropTask,
  } = useTaskDrag({
    canEdit,
    tasks,
    setTasks,
    toast,
    setError: () => {},
  });

  useBoardRealtime({
    boardId: id,
    userId,
    setColumns,
    setTasks,
    setRole,
    fetchMembers,
    toast,
  });

  useEffect(() => {
    setNewColumn("");
    setNewTask({});
  }, [role]);

  const handleUpdateTask = async (taskId, patch) => {
    if (!canEdit) return false;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
    const { error: updErr } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", taskId);
    if (updErr) {
      toast.error(updErr.message || "Gagal update task");
      refetch();
      return false;
    }
    return true;
  };

  const handleUpdateColumn = async (columnId, patch) => {
    if (!canEdit) return false;
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, ...patch } : c))
    );
    const { error: updErr } = await supabase
      .from("columns")
      .update(patch)
      .eq("id", columnId);
    if (updErr) {
      toast.error(updErr.message || "Gagal update kolom");
      refetch();
      return false;
    }
    return true;
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menambah kolom.");
      return;
    }
    if (!newColumn.trim()) return;
    setAddingColumn(true);
    const maxPos = columns.length
      ? Math.max(...columns.map((c) => c.position || 0))
      : 0;

    const used = columns
      .map((c) => c.colorIndex)
      .filter((v) => v !== undefined && v !== null);
    const available = columnColorList
      .map((_, i) => i)
      .filter((i) => !used.includes(i));
    const colorIndex =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : Math.floor(Math.random() * columnColorList.length);

    const { error: insErr } = await supabase.from("columns").insert([
      {
        name: newColumn.trim(),
        board_id: id,
        position: maxPos + 1,
        colorIndex,
      },
    ]);
    if (insErr) toast.error(insErr.message);
    setNewColumn("");
    setAddingColumn(false);
    refetch();
  };

  const handleDeleteColumn = async (columnId) => {
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menghapus kolom.");
      return;
    }
    if (!window.confirm("Hapus kolom beserta semua task di dalamnya?")) return;
    await supabase.from("tasks").delete().eq("column_id", columnId);
    const { error: delErr } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);
    if (delErr) toast.error(delErr.message);
    refetch();
  };

  const handleAddTask = async (e, columnId) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menambah task.");
      return false;
    }
    const draft = newTask[columnId] || { title: "", content: "", deadline: "" };
    if (!draft.title.trim()) return false;
    setAddingTask((t) => ({ ...t, [columnId]: true }));
    const colTasks = tasks.filter((t) => t.column_id === columnId);
    const maxPos = colTasks.length
      ? Math.max(...colTasks.map((t) => t.position || 0))
      : 0;
    const { error: insErr } = await supabase.from("tasks").insert([
      {
        title: draft.title.trim(),
        content: draft.content?.trim() || "",
        column_id: columnId,
        position: maxPos + 1,
        deadline: draft.deadline || null,
      },
    ]);
    if (insErr) toast.error(insErr.message);
    setNewTask((t) => ({
      ...t,
      [columnId]: { title: "", content: "", deadline: "" },
    }));
    setAddingTask((t) => ({ ...t, [columnId]: false }));
    return true;
  };

  const handleDeleteTask = async (taskId) => {
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa menghapus task.");
      return;
    }
    if (!window.confirm("Hapus task ini?")) return;
    const { error: delErr } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);
    if (delErr) toast.error(delErr.message);
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
    <div className="py-2 px-4 bg-gray-900 min-h-screen overflow-hidden">
      <BoardInvite
        boardId={board.id}
        canEdit={canEdit}
        members={members}
        loading={membersLoading}
        error={membersError}
        fetchMembers={fetchMembers}
        inviteMember={inviteMember}
        updateRole={updateRole}
        removeMember={removeMember}
        userId={userId}
      />
      <div className="w-full flex flex-col items-center justify-center">
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
            disabled={addingColumn || !canEdit}
          />
          <button
            type="submit"
            className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 transition-colors cursor-pointer ml-2 disabled:opacity-50"
            disabled={addingColumn || !canEdit}
          >
            Tambah Kolom
          </button>
        </form>
        <div className="flex gap-6 overflow-x-auto pb-6 w-full justify-start items-start">
          {columns.map((col, idx) => (
            <Column
              key={col.id}
              col={col}
              tasks={tasks.filter((t) => t.column_id === col.id)}
              idx={idx}
              canEdit={canEdit}
              isViewer={isViewer}
              role={role}
              draggedTask={draggedTask}
              handleDragOverTask={handleDragOverTask}
              handleDropTask={handleDropTask}
              handleDragStartTask={handleDragStartTask}
              handleDeleteTask={handleDeleteTask}
              handleDeleteColumn={handleDeleteColumn}
              handleAddTask={handleAddTask}
              handleUpdateTask={handleUpdateTask}
              handleUpdateColumn={handleUpdateColumn}
              newTask={newTask}
              setNewTask={setNewTask}
              addingTask={addingTask}
              toast={toast}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
