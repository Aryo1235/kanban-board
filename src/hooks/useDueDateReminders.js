import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useDueDateReminders(boardId) {
  useEffect(() => {
    if (!boardId) return;

    const checkDueDates = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get tasks with deadlines that are approaching
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        const { data: tasks, error } = await supabase
          .from("tasks")
          .select("id, title, deadline, assigned_to, columns(board_id)")
          .eq("columns.board_id", boardId)
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .lte("deadline", weekFromNow.toISOString());

        if (error) {
          console.error("Error fetching tasks for due date check:", error);
          return;
        }

        // Check each task for reminders
        for (const task of tasks) {
          if (!task.assigned_to) continue;

          const deadline = new Date(task.deadline);
          const daysUntilDue = Math.ceil(
            (deadline - now) / (1000 * 60 * 60 * 24)
          );

          // Check if reminder already sent for this task and timeframe
          const { data: existingReminder } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", task.assigned_to)
            .eq("task_id", task.id)
            .eq("type", "due_date_reminder")
            .gte(
              "created_at",
              new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            ) // Last 24 hours
            .single();

          if (existingReminder) continue; // Already sent reminder recently

          // Send reminder based on urgency
          if (daysUntilDue <= 0) {
            // Overdue - send immediate reminder
            await supabase.from("notifications").insert([
              {
                user_id: task.assigned_to,
                type: "due_date_reminder",
                title: "⚠️ Task Sudah Jatuh Tempo!",
                message: `Task "${task.title}" sudah melewati deadline! Segera selesaikan.`,
                task_id: task.id,
                board_id: boardId,
              },
            ]);
          } else if (daysUntilDue === 1) {
            // Due tomorrow
            await supabase.from("notifications").insert([
              {
                user_id: task.assigned_to,
                type: "due_date_reminder",
                title: "⏰ Deadline Besok",
                message: `Task "${task.title}" akan jatuh tempo besok. Pastikan sudah selesai.`,
                task_id: task.id,
                board_id: boardId,
              },
            ]);
          } else if (daysUntilDue <= 3) {
            // Due within 3 days
            await supabase.from("notifications").insert([
              {
                user_id: task.assigned_to,
                type: "due_date_reminder",
                title: "📅 Deadline Mendekat",
                message: `Task "${task.title}" akan jatuh tempo dalam ${daysUntilDue} hari.`,
                task_id: task.id,
                board_id: boardId,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error in due date reminder check:", error);
      }
    };

    // Check immediately
    checkDueDates();

    // Set up interval to check every hour
    const interval = setInterval(checkDueDates, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [boardId]);
}
