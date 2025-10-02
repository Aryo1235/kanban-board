import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import BoardInvite from "../components/BoardInvite";
import Column from "../components/Column";
import useBoardInvite from "../hooks/useBoardInvite";

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
  // newTask sekarang menyimpan object per kolom: { [columnId]: { title: string, content: string } }
  const [newTask, setNewTask] = useState({});
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingTask, setAddingTask] = useState({}); // { [columnId]: false }
  const [role, setRole] = useState("");
  // Untuk mencegah spam toast saat drag
  const [dragToastShown, setDragToastShown] = useState(false);
  const [userId, setUserId] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null); // { task, fromColumnId }
  // Metadata drag: originIndex, originColumn, dropSucceeded
  const dragMetaRef = useRef({ originColumnId: null, originIndex: null, dropSucceeded: false });

  // Optimistic update helpers for editing
  const handleUpdateTask = async (taskId, patch) => {
    if (!canEdit) return false;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    const { error: updErr } = await supabase.from('tasks').update(patch).eq('id', taskId);
    if (updErr) {
      toast.error(updErr.message || 'Gagal update task');
      // refetch fallback
      fetchData();
      return false;
    }
    return true; // realtime akan sync final row
  };

  const handleUpdateColumn = async (columnId, patch) => {
    if (!canEdit) return false;
    setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, ...patch } : c)));
    const { error: updErr } = await supabase.from('columns').update(patch).eq('id', columnId);
    if (updErr) {
      toast.error(updErr.message || 'Gagal update kolom');
      fetchData();
      return false;
    }
    return true;
  };
  const {
    members,
    loading: membersLoading,
    error: membersError,
    fetchMembers,
    inviteMember,
    updateRole,
    removeMember,
  } = useBoardInvite(id);
  const canEdit = role === "owner" || role === "editor";
  const isViewer = role === "viewer";

  // Subscribe perubahan role user di board_members agar canEdit/isViewer selalu update
  console.log(role);
  // Reset state saat role berubah agar UI/validasi langsung update
  useEffect(() => {
    setNewColumn("");
  setNewTask({});
    setDraggedTask(null);
    setAddingColumn(false);
    setAddingTask({});
  }, [role]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getUser();
  }, []);
  // Realtime channel ref
  const realtimeChannel = useRef(null);

  const handleDragStartTask = (task, fromColumnId) => {
    if (!canEdit) {
      toast.error("Hanya owner/editor yang bisa memindahkan task.");
      setDragToastShown(true);
      return;
    }
    setDraggedTask({ task, fromColumnId });
    setDragToastShown(false);
    // Simpan origin info
    const originTasks = tasks
      .filter((t) => t.column_id === fromColumnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const originIndex = originTasks.findIndex((t) => t.id === task.id);
    dragMetaRef.current = {
      originColumnId: fromColumnId,
      originIndex,
      dropSucceeded: false,
    };
  };

  const handleDragOverTask = (e) => {
    if (!canEdit) {
      // Tidak perlu toast di dragOver agar tidak spam
      return;
    }
    e.preventDefault();
  };

  const handleDropTask = async (e, toColumnId, dropIndex = null) => {
    if (!canEdit) {
      setDragToastShown(false);
      return;
    }
    e.preventDefault();
    if (!draggedTask) return;
    const { task, fromColumnId } = draggedTask;
    setError("");
    // Tandai drop valid (hanya fungsi ini yang dianggap valid drop zone)
    dragMetaRef.current.dropSucceeded = true;

    // Ambil tasks di kolom tujuan dalam urutan sekarang (integer only)
    const colTasks = tasks
      .filter((t) => t.column_id === toColumnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    // CASE 1: Reorder dalam kolom yang sama
    if (fromColumnId === toColumnId && dropIndex !== null) {
      const currentIndex = colTasks.findIndex((t) => t.id === task.id);
      if (currentIndex === -1) return;

      // Jika tidak ada perubahan posisi
      if (currentIndex === dropIndex || (currentIndex === dropIndex - 1 && dropIndex > 0)) {
        setDraggedTask(null);
        return;
      }

      // Buat array baru tanpa task yang dipindah
      const reordered = [...colTasks];
      const [moved] = reordered.splice(currentIndex, 1);
      let insertionIndex = dropIndex;
      if (currentIndex < dropIndex) insertionIndex = dropIndex - 1;
      if (insertionIndex < 0) insertionIndex = 0;
      if (insertionIndex > reordered.length) insertionIndex = reordered.length;
      reordered.splice(insertionIndex, 0, moved);

      // Hitung posisi baru & siapkan update hanya untuk yang berubah
      const updates = [];
      const newPosMap = {};
      reordered.forEach((t, i) => {
        const newPos = i + 1;
        newPosMap[t.id] = newPos;
        if ((t.position || 0) !== newPos) {
          updates.push({ id: t.id, newPos });
        }
      });

      // Optimistic UI: update state lokal sebelum realtime datang
      if (updates.length > 0) {
        setTasks((prev) =>
          prev.map((t) =>
            newPosMap[t.id]
              ? { ...t, position: newPosMap[t.id] }
              : t
          )
        );
      }

      console.log("Reorder debug:", {
        fromIndex: currentIndex,
        toIndex: insertionIndex,
        dropIndex,
        originalLength: colTasks.length,
        updates,
      });

      // Jalankan update hanya untuk task yang posisinya berubah
      for (const u of updates) {
        const { error: updErr } = await supabase
          .from("tasks")
          .update({ position: u.newPos })
          .eq("id", u.id);
        if (updErr) {
          setError(updErr.message);
          console.error("Update position failed", u, updErr.message);
          break;
        } else {
          console.log("Updated position", u);
        }
      }
    }
    // CASE 2: Pindah antar kolom
    else if (fromColumnId !== toColumnId) {
      // Reorder di kolom tujuan sesuai dropIndex (kalau null -> taruh di bawah)
      const destTasks = colTasks; // sudah tasks di kolom tujuan (sorted)
      let insertionIndex = destTasks.length; // default append
      if (dropIndex !== null && dropIndex !== undefined) {
        insertionIndex = Math.min(Math.max(dropIndex, 0), destTasks.length);
      }

      // Buat array baru dengan task yang dipindah disisipkan
      const destReordered = [...destTasks];
      const movedClone = { ...task, column_id: toColumnId }; // clone untuk optimistic
      destReordered.splice(insertionIndex, 0, movedClone);

      // Normalisasi posisi tujuan
      const destNewPosMap = {};
      const destUpdates = [];
      destReordered.forEach((t, i) => {
        const newPos = i + 1;
        destNewPosMap[t.id] = newPos;
        if ((t.position || 0) !== newPos || t.id === task.id || t.column_id !== toColumnId) {
          // termasuk moved task yang column_id berubah
          destUpdates.push({ id: t.id, position: newPos, column_id: toColumnId });
        }
      });

      // Normalisasi posisi kolom asal (opsional untuk hilangkan gap)
      const originTasks = tasks
        .filter((t) => t.column_id === fromColumnId && t.id !== task.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      const originUpdates = [];
      const originNewPosMap = {};
      originTasks.forEach((t, i) => {
        const newPos = i + 1;
        originNewPosMap[t.id] = newPos;
        if ((t.position || 0) !== newPos) {
          originUpdates.push({ id: t.id, position: newPos });
        }
      });

      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return { ...t, column_id: toColumnId, position: destNewPosMap[t.id] };
          }
          if (destNewPosMap[t.id]) {
            return { ...t, position: destNewPosMap[t.id] };
          }
          if (originNewPosMap[t.id]) {
            return { ...t, position: originNewPosMap[t.id] };
          }
          return t;
        })
      );

      // Kirim update ke DB (moved task dulu, lalu lainnya). Hindari upsert untuk menjaga content.
      // Moved task
      const movedNewPos = destNewPosMap[task.id];
      const { error: movedErr } = await supabase
        .from("tasks")
        .update({ column_id: toColumnId, position: movedNewPos })
        .eq("id", task.id);
      if (movedErr) {
        setError(movedErr.message);
        console.error("Move task cross-column failed", movedErr.message);
      }

      // Destination other tasks
      for (const u of destUpdates) {
        if (u.id === task.id) continue; // sudah diupdate
        const { error: updErr } = await supabase
          .from("tasks")
          .update({ position: u.position })
          .eq("id", u.id);
        if (updErr) {
          console.error("Update dest position failed", u, updErr.message);
          break;
        }
      }

      // Origin tasks (reindex)
      for (const u of originUpdates) {
        const { error: updErr } = await supabase
          .from("tasks")
          .update({ position: u.position })
          .eq("id", u.id);
        if (updErr) {
          console.error("Update origin position failed", u, updErr.message);
          break;
        }
      }
    }

    setDraggedTask(null);
    setDragToastShown(false);
    // Realtime subscription akan update UI; fallback fetch jika perlu
    // fetchData();
  };

  // Global listeners: batal drag jika Esc atau drop di luar zona valid
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && draggedTask) {
        // Batalkan drag manual
        dragMetaRef.current.dropSucceeded = false; // paksa revert
        setDraggedTask(null);
      }
    };
    const handleDragEndGlobal = () => {
      if (draggedTask) {
        // Jika belum sukses (drop di area non-drop-zone), revert (state kita belum berubah anyway)
        if (!dragMetaRef.current.dropSucceeded) {
          // Tidak ada perubahan DB karena kita hanya commit saat drop valid.
        }
        // Bersihkan
        dragMetaRef.current = { originColumnId: null, originIndex: null, dropSucceeded: false };
        setDraggedTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragend', handleDragEndGlobal);
    window.addEventListener('drop', handleDragEndGlobal);
    window.addEventListener('mouseup', handleDragEndGlobal); // fallback kalau dragend tidak fire (browser edge cases)
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragend', handleDragEndGlobal);
      window.removeEventListener('drop', handleDragEndGlobal);
      window.removeEventListener('mouseup', handleDragEndGlobal);
    };
  }, [draggedTask]);

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

  // Fetch data awal saja
  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line
  }, [id]);

  // Realtime subscription: update state langsung dari payload event
  useEffect(() => {
    // Unsubscribe channel lama jika ada
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }

    // Subscribe ke semua perubahan tabel columns dan tasks
    const channel = supabase
      .channel("realtime:board-detail")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns" },
        (payload) => {
          console.log("Realtime event columns:", payload);
          switch (payload.eventType) {
            case "INSERT":
              setColumns((prev) => [...prev, payload.new]);
              break;
            case "UPDATE":
              setColumns((prev) =>
                prev.map((col) =>
                  col.id === payload.new.id ? payload.new : col
                )
              );
              break;
            case "DELETE":
              setColumns((prev) =>
                prev.filter((col) => col.id !== payload.old.id)
              );
              setTasks((prev) =>
                prev.filter((task) => task.column_id !== payload.old.id)
              );
              break;
            default:
              break;
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("Realtime event tasks:", payload);
          switch (payload.eventType) {
            case "INSERT":
              setTasks((prev) => [...prev, payload.new]);
              break;
            case "UPDATE":
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === payload.new.id ? payload.new : task
                )
              );
              break;
            case "DELETE":
              setTasks((prev) =>
                prev.filter((task) => task.id !== payload.old.id)
              );
              break;
            default:
              break;
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_members" },
        (payload) => {
          fetchMembers();
          console.log("Realtime event board_members:", payload);
          // Jika role user yang login berubah, update state role
          if (
            payload.new &&
            userId &&
            payload.new.user_id === userId &&
            payload.new.board_id == id
          ) {
            setRole(payload.new.role);
            console.log("Role updated:", payload.new.role);
            toast.success(
              `Role Anda di board ini berubah menjadi: ${payload.new.role}`
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Channel status:", status);
      });
    realtimeChannel.current = channel;

    // Cleanup subscription saat komponen unmount
    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [id, columns.length, userId]); // Tambahkan columns.length untuk trigger ulang saat ada perubahan struktur kolom

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
      return false;
    }
  const draft = newTask[columnId] || { title: "", content: "", deadline: "" };
    // Validasi: minimal harus ada title
    if (!draft.title.trim()) return false;
    setAddingTask((t) => ({ ...t, [columnId]: true }));
    setError("");
    const colTasks = tasks.filter((t) => t.column_id === columnId);
    const maxPos =
      colTasks.length > 0
        ? Math.max(...colTasks.map((t) => t.position || 0))
        : 0;
    const { error: insertError } = await supabase.from("tasks").insert([
      {
        title: draft.title.trim(),
        content: draft.content?.trim() || "",
        column_id: columnId,
        position: maxPos + 1,
        deadline: draft.deadline || null,
      },
    ]);
    if (insertError) {
      setError(insertError.message);
      console.error("Insert error:", insertError);
      setAddingTask((t) => ({ ...t, [columnId]: false }));
      return false;
    }

    // DEBUG: Cek data hasil insert FE dan relasinya
    const { data: insertedTask, error: fetchInsertedError } = await supabase
      .from("tasks")
      .select("*, columns(*, boards(*))")
  .eq("title", draft.title.trim())
      .order("id", { ascending: false })
      .limit(1)
      .single();

    console.log("DEBUG: Task FE baru:", insertedTask, fetchInsertedError);
    if (insertedTask) {
      console.log("DEBUG: column_id:", insertedTask.column_id);
      console.log("DEBUG: columns:", insertedTask.columns);
      if (insertedTask.columns) {
        console.log(
          "DEBUG: board_id di columns:",
          insertedTask.columns.board_id
        );
        console.log("DEBUG: boards:", insertedTask.columns.boards);
      }
    }

  setNewTask((t) => ({ ...t, [columnId]: { title: "", content: "", deadline: "" } }));
    setAddingTask((t) => ({ ...t, [columnId]: false }));
    fetchData();
    return true;
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
