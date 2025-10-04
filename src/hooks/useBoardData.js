import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export function useBoardData(boardId) {
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError("");
    try {
      const { data: boardData, error: boardErr } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single();
      if (boardErr) throw boardErr;
      setBoard(boardData);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        setRole("");
      } else if (boardData.user_id === authData.user.id) {
        setRole("owner");
      } else {
        const { data: member, error: memberErr } = await supabase
          .from("board_members")
          .select("role")
          .eq("board_id", boardId)
          .eq("user_id", authData.user.id)
          .maybeSingle();
        setRole(memberErr || !member ? "" : member.role);
      }

      const { data: cols, error: colErr } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", boardId)
        .order("position", { ascending: true });
      if (colErr) throw colErr;
      setColumns(cols || []);

      if ((cols || []).length) {
        const { data: tks, error: taskErr } = await supabase
          .from("tasks")
          .select("*")
          .in(
            "column_id",
            cols.map((c) => c.id)
          )
          .order("position", { ascending: true });
        if (taskErr) throw taskErr;
        setTasks(tks || []);
      } else {
        setTasks([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    board,
    columns,
    tasks,
    role,
    loading,
    error,
    setColumns,
    setTasks,
    setRole,
    refetch: fetchAll,
  };
}
