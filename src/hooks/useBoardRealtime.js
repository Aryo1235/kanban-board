import { useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

export function useBoardRealtime({
  boardId,
  userId,
  setColumns,
  setTasks,
  setRole,
  fetchMembers,
  toast,
}) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!boardId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`realtime:board-detail:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns" },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              setColumns((p) => [...p, payload.new]);
              break;
            case "UPDATE":
              setColumns((p) =>
                p.map((c) => (c.id === payload.new.id ? payload.new : c))
              );
              break;
            case "DELETE":
              setColumns((p) => p.filter((c) => c.id !== payload.old.id));
              setTasks((p) => p.filter((t) => t.column_id !== payload.old.id));
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
          switch (payload.eventType) {
            case "INSERT":
              setTasks((p) => [...p, payload.new]);
              break;
            case "UPDATE":
              setTasks((p) =>
                p.map((t) => (t.id === payload.new.id ? payload.new : t))
              );
              break;
            case "DELETE":
              setTasks((p) => p.filter((t) => t.id !== payload.old.id));
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
          fetchMembers?.();
          if (
            payload.new &&
            userId &&
            payload.new.user_id === userId &&
            payload.new.board_id == boardId
          ) {
            setRole(payload.new.role);
            toast?.success?.(
              `Role Anda di board ini berubah menjadi: ${payload.new.role}`
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [boardId, userId, setColumns, setTasks, setRole, fetchMembers, toast]);
}
