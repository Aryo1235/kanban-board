import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function BoardSupabase() {
  const [boards, setBoards] = useState([]);
  const [newBoard, setNewBoard] = useState("");
  const [loading, setLoading] = useState(false); // loading untuk fetch awal
  const [adding, setAdding] = useState(false); // loading khusus tambah board
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  console.log(boards);
  useEffect(() => {
    const getUserAndBoards = async () => {
      setLoading(true);
      setError("");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("User not found. Silakan login ulang.");
        setLoading(false);
        return;
      }

      setUser(user);

      console.log("[FETCH] board_members untuk user", user.id);
      const { data: memberBoards, error: memberError } = await supabase
        .from("board_members")
        .select("board_id, role, status")
        .eq("user_id", user.id)
        .eq("status", "accepted");
      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }
      const boardIdsFromMembers = memberBoards.map((bm) => bm.board_id);

      console.log("[FETCH] boards sebagai owner untuk user", user.id);
      const { data: ownerBoards, error: ownerError } = await supabase
        .from("boards")
        .select("*")
        .eq("user_id", user.id);
      if (ownerError) {
        setError(ownerError.message);
        setLoading(false);
        return;
      }
      const ownerBoardIds = ownerBoards.map((b) => b.id);

      // Gabungkan semua board_id (dari board_members dan owner)
      const allBoardIds = Array.from(
        new Set([...boardIdsFromMembers, ...ownerBoardIds])
      );

      // Ambil semua boards yang id-nya ada di allBoardIds
      let boardsData = [];
      if (allBoardIds.length > 0) {
        console.log("[FETCH] boards by allBoardIds", allBoardIds);
        const { data, error: boardError } = await supabase
          .from("boards")
          .select("*")
          .in("id", allBoardIds)
          .order("created_at", { ascending: true });
        if (boardError) {
          setError(boardError.message);
          setLoading(false);
          return;
        }
        // Gabungkan role dari board_members ke boards, jika owner maka role: "owner"
        boardsData = data.map((b) => {
          let role = "";
          if (b.user_id === user.id) {
            role = "owner";
          } else {
            const member = memberBoards.find((bm) => bm.board_id === b.id);
            if (member?.role === "viewer") {
              role = "viewer";
            } else if (member?.role === "editor") {
              role = "editor";
            } else {
              role = "editor"; // default jika tidak ada role
            }
          }
          return { ...b, role };
        });
      }
      setBoards(boardsData || []);
      setLoading(false);
    };

    getUserAndBoards();
  }, []);

  const handleAddBoard = async (e) => {
    e.preventDefault();
    if (!newBoard.trim() || !user) return;
    setAdding(true);
    setError("");

    try {
      // 1. Insert Board
      const { data: boardData, error: insertBoardError } = await supabase
        .from("boards")
        .insert({
          name: newBoard,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertBoardError) throw insertBoardError;

      // 2. Tambahkan pembuat sebagai board member
      const { error: memberError } = await supabase
        .from("board_members")
        .insert({
          board_id: boardData.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      // 3. Tambahkan default columns
      const defaultColumns = [
        { name: "To Do", position: 1, board_id: boardData.id },
        { name: "In Progress", position: 2, board_id: boardData.id },
        { name: "Done", position: 3, board_id: boardData.id },
      ];

      const { error: columnsError } = await supabase
        .from("columns")
        .insert(defaultColumns);

      if (columnsError) throw columnsError;

      // Optimistic update: langsung tambahkan board baru ke state dan sort by created_at desc
      const newBoardObj = {
        ...boardData,
        role: "owner",
        status: "accepted",
      };
      setBoards((prev) => {
        const boardsSorted = [...prev, newBoardObj].sort((a, b) => {
          // created_at bisa null jika error, fallback ke id
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return (b.id || 0) - (a.id || 0);
        });
        return boardsSorted;
      });
      setNewBoard("");
    } catch (error) {
      setError(error.message);
    } finally {
      setAdding(false);
    }
  };
  // Edit board inline
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingBoardName, setEditingBoardName] = useState("");
  const [loadingBoardId, setLoadingBoardId] = useState(null);

  const handleEditBoard = (board) => {
    setEditingBoardId(board.id);
    setEditingBoardName(board.name);
  };
  const handleEditBoardSubmit = async (board) => {
    if (!editingBoardName.trim()) return;
    setLoadingBoardId(board.id);
    const { error: updateError } = await supabase
      .from("boards")
      .update({ name: editingBoardName })
      .eq("id", board.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setBoards((bs) =>
        bs.map((b) =>
          b.id === board.id ? { ...b, name: editingBoardName } : b
        )
      );
      setEditingBoardId(null);
    }
    setLoadingBoardId(null);
  };
  const handleEditBoardCancel = () => {
    setEditingBoardId(null);
  };

  // Delete board
  const handleDeleteBoard = async (boardId) => {
    if (
      !window.confirm(
        "Hapus board ini beserta semua kolom dan task di dalamnya?"
      )
    )
      return;
    setLoadingBoardId(boardId);
    setError("");
    // Hapus semua kolom dan task di board ini
    const { data: columns } = await supabase
      .from("columns")
      .select("id")
      .eq("board_id", boardId);
    if (columns && columns.length > 0) {
      const columnIds = columns.map((c) => c.id);
      await supabase.from("tasks").delete().in("column_id", columnIds);
      await supabase.from("columns").delete().in("id", columnIds);
    }
    // Hapus board
    const { error: delError } = await supabase
      .from("boards")
      .delete()
      .eq("id", boardId);
    if (delError) setError(delError.message);
    setBoards((bs) => bs.filter((b) => b.id !== boardId));
    setLoadingBoardId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Board Saya (Supabase)</h1>
      <form onSubmit={handleAddBoard} className="flex gap-2 mb-6">
        <input
          type="text"
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          placeholder="Nama board baru"
          value={newBoard}
          onChange={(e) => setNewBoard(e.target.value)}
          disabled={adding}
        />
        <button
          type="submit"
          className="bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded text-white font-bold"
          disabled={adding}
        >
          {adding ? "Menambah..." : "Tambah"}
        </button>
      </form>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      <div className="w-full max-w-lg space-y-4">
        {boards.length === 0 && !loading && (
          <div className="text-gray-400 text-center">Belum ada board.</div>
        )}
        {boards.map((board) => (
          <div
            key={board.id}
            className="bg-gray-800 p-4 rounded flex items-center justify-between gap-2 hover:bg-gray-700 transition-colors"
          >
            {editingBoardId === board.id ? (
              board.role === "owner" && (
                <>
                  <input
                    className="bg-gray-900 text-white rounded p-1 flex-1 mr-2"
                    value={editingBoardName}
                    onChange={(e) => setEditingBoardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditBoardSubmit(board);
                      if (e.key === "Escape") handleEditBoardCancel();
                    }}
                    autoFocus
                    disabled={loadingBoardId === board.id}
                  />
                  <button
                    onClick={() => handleEditBoardSubmit(board)}
                    className="text-lime-400 mr-1"
                    disabled={loadingBoardId === board.id}
                  >
                    ✔
                  </button>
                  <button
                    onClick={handleEditBoardCancel}
                    className="text-red-400"
                    disabled={loadingBoardId === board.id}
                  >
                    ✖
                  </button>
                </>
              )
            ) : (
              <>
                <span
                  className="font-semibold flex-1 cursor-pointer"
                  onDoubleClick={() =>
                    board.role === "owner" && handleEditBoard(board)
                  }
                  onClick={() => navigate(`/supabase/board/${board.id}`)}
                >
                  {board.name}
                  {board.role === "owner" && (
                    <span className="ml-2 text-xs text-lime-400">(Owner)</span>
                  )}
                  {board.role === "viewer" && (
                    <span className="ml-2 text-xs text-blue-400">(Viewer)</span>
                  )}
                  {board.role === "editor" && (
                    <span className="ml-2 text-xs text-amber-400">
                      (Editor)
                    </span>
                  )}
                  {board.status && board.status !== "accepted" && (
                    <span className="ml-2 text-xs text-yellow-400">
                      ({board.status})
                    </span>
                  )}
                </span>
                {board.role === "owner" && (
                  <>
                    <button
                      className="text-blue-400 hover:text-blue-300 text-sm ml-2 cursor-pointer"
                      title="Edit board"
                      onClick={() => handleEditBoard(board)}
                      disabled={loadingBoardId === board.id}
                    >
                      ✎
                    </button>
                    <button
                      className="text-red-400 hover:text-red-300 text-sm ml-2 cursor-pointer"
                      title="Hapus board"
                      onClick={() => handleDeleteBoard(board.id)}
                      disabled={loadingBoardId === board.id}
                    >
                      🗑️
                    </button>
                  </>
                )}
                {/* Untuk viewer/editor, tidak ada tombol edit/hapus */}
                <span className="text-xs text-gray-400">Lihat &gt;</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
