import { useRef, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useTaskDrag({ canEdit, tasks, setTasks, toast, setError }) {
  const [draggedTask, setDraggedTask] = useState(null); // { task, fromColumnId }
  const dragMetaRef = useRef({
    originColumnId: null,
    originIndex: null,
    dropSucceeded: false,
  });

  const handleDragStartTask = (task, fromColumnId) => {
    if (!canEdit) {
      toast?.error?.("Hanya owner/editor yang bisa memindahkan task.");
      return;
    }
    setDraggedTask({ task, fromColumnId });
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
    if (!canEdit) return;
    e.preventDefault();
  };

  const handleDropTask = async (e, toColumnId, dropIndex = null) => {
    if (!canEdit) return;
    e.preventDefault();
    if (!draggedTask) return;
    dragMetaRef.current.dropSucceeded = true;

    const { task, fromColumnId } = draggedTask;
    setError?.("");

    const colTasks = tasks
      .filter((t) => t.column_id === toColumnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    // Reorder dalam kolom sama
    if (fromColumnId === toColumnId && dropIndex !== null) {
      const currentIndex = colTasks.findIndex((t) => t.id === task.id);
      if (currentIndex === -1) return;

      if (
        currentIndex === dropIndex ||
        (currentIndex === dropIndex - 1 && dropIndex > 0)
      ) {
        setDraggedTask(null);
        return;
      }

      const reordered = [...colTasks];
      const [moved] = reordered.splice(currentIndex, 1);
      let insertionIndex = dropIndex;
      if (currentIndex < dropIndex) insertionIndex = dropIndex - 1;
      if (insertionIndex < 0) insertionIndex = 0;
      if (insertionIndex > reordered.length) insertionIndex = reordered.length;
      reordered.splice(insertionIndex, 0, moved);

      const updates = [];
      const newPosMap = {};
      reordered.forEach((t, i) => {
        const newPos = i + 1;
        newPosMap[t.id] = newPos;
        if ((t.position || 0) !== newPos) updates.push({ id: t.id, newPos });
      });

      if (updates.length) {
        setTasks((prev) =>
          prev.map((t) =>
            newPosMap[t.id] ? { ...t, position: newPosMap[t.id] } : t
          )
        );
        for (const u of updates) {
          const { error: updErr } = await supabase
            .from("tasks")
            .update({ position: u.newPos })
            .eq("id", u.id);
          if (updErr) {
            setError?.(updErr.message);
            break;
          }
        }
      }
    } else if (fromColumnId !== toColumnId) {
      let insertionIndex = colTasks.length;
      if (dropIndex !== null && dropIndex !== undefined) {
        insertionIndex = Math.min(Math.max(dropIndex, 0), colTasks.length);
      }
      const destReordered = [...colTasks];
      const movedClone = { ...task, column_id: toColumnId };
      destReordered.splice(insertionIndex, 0, movedClone);

      const destNewPosMap = {};
      const destUpdates = [];
      destReordered.forEach((t, i) => {
        const newPos = i + 1;
        destNewPosMap[t.id] = newPos;
        if (
          (t.position || 0) !== newPos ||
          t.id === task.id ||
          t.column_id !== toColumnId
        ) {
          destUpdates.push({
            id: t.id,
            position: newPos,
            column_id: toColumnId,
          });
        }
      });

      const originTasks = tasks
        .filter((t) => t.column_id === fromColumnId && t.id !== task.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      const originUpdates = [];
      const originNewPosMap = {};
      originTasks.forEach((t, i) => {
        const newPos = i + 1;
        originNewPosMap[t.id] = newPos;
        if ((t.position || 0) !== newPos)
          originUpdates.push({ id: t.id, position: newPos });
      });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id)
            return {
              ...t,
              column_id: toColumnId,
              position: destNewPosMap[t.id],
            };
          if (destNewPosMap[t.id])
            return { ...t, position: destNewPosMap[t.id] };
          if (originNewPosMap[t.id])
            return { ...t, position: originNewPosMap[t.id] };
          return t;
        })
      );

      const movedNewPos = destNewPosMap[task.id];
      const { error: movedErr } = await supabase
        .from("tasks")
        .update({ column_id: toColumnId, position: movedNewPos })
        .eq("id", task.id);
      if (movedErr) setError?.(movedErr.message);

      for (const u of destUpdates) {
        if (u.id === task.id) continue;
        const { error: updErr } = await supabase
          .from("tasks")
          .update({ position: u.position })
          .eq("id", u.id);
        if (updErr) break;
      }
      for (const u of originUpdates) {
        const { error: updErr } = await supabase
          .from("tasks")
          .update({ position: u.position })
          .eq("id", u.id);
        if (updErr) break;
      }
    }

    setDraggedTask(null);
  };

  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === "Escape" && draggedTask) {
        dragMetaRef.current.dropSucceeded = false;
        setDraggedTask(null);
      }
    };
    const endHandler = () => {
      if (draggedTask && !dragMetaRef.current.dropSucceeded) {
        setDraggedTask(null);
      }
    };
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("dragend", endHandler);
    window.addEventListener("drop", endHandler);
    window.addEventListener("mouseup", endHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("dragend", endHandler);
      window.removeEventListener("drop", endHandler);
      window.removeEventListener("mouseup", endHandler);
    };
  }, [draggedTask]);

  return {
    draggedTask,
    handleDragStartTask,
    handleDragOverTask,
    handleDropTask,
  };
}
