import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useTaskAssignment(boardId) {
  const [boardMembers, setBoardMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    fetchBoardMembers();
  }, [boardId]);

  const fetchBoardMembers = async () => {
    setLoading(true);
    try {
      // Get board owner
      const { data: board } = await supabase
        .from("boards")
        .select("user_id, profiles:user_id(*)")
        .eq("id", boardId)
        .single();

      // Get board members
      const { data: members } = await supabase
        .from("board_members")
        .select(
          `
          user_id,
          role,
          profiles:user_id(*)
        `
        )
        .eq("board_id", boardId);

      const allMembers = [];

      // Add owner
      if (board?.profiles) {
        allMembers.push({
          user_id: board.user_id,
          role: "owner",
          profiles: board.profiles,
        });
      }

      // Add members
      if (members) {
        allMembers.push(...members);
      }

      setBoardMembers(allMembers);
    } catch (error) {
      console.error("Error fetching board members:", error);
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId, assignToUserId, assignedByUserId) => {
    const updateData = {
      assigned_to: assignToUserId,
      assigned_at: assignToUserId ? new Date().toISOString() : null,
      assigned_by: assignToUserId ? assignedByUserId : null,
    };

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);

    if (!error && assignToUserId) {
      // Create notification
      await createAssignmentNotification(
        taskId,
        assignToUserId,
        assignedByUserId
      );
    }

    return !error;
  };

  const createAssignmentNotification = async (
    taskId,
    assignedToId,
    assignedById
  ) => {
    console.log("Creating assignment notification:", {
      taskId,
      assignedToId,
      assignedById,
    });

    const { data: task } = await supabase
      .from("tasks")
      .select("title")
      .eq("id", taskId)
      .single();

    const { data: assigner } = await supabase
      .from("profiles")
      .select("username, email")
      .eq("id", assignedById)
      .single();

    console.log("Assigner data:", assigner);

    const notificationData = {
      user_id: assignedToId,
      type: "task_assigned",
      title: "Task Baru Ditugaskan",
      message: `${
        assigner?.username || assigner?.email || "Seseorang"
      } menugaskan task "${task?.title}" kepada Anda`,
      task_id: taskId,
      board_id: boardId,
    };

    console.log("Inserting notification:", notificationData);

    const { data, error } = await supabase
      .from("notifications")
      .insert([notificationData]);

    if (error) {
      console.error("Error creating notification:", error);
    } else {
      console.log("Notification created successfully:", data);
    }
  };

  return {
    boardMembers,
    loading,
    assignTask,
    refetch: fetchBoardMembers,
  };
}
