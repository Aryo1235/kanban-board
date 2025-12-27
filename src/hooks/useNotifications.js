import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const userId = await getCurrentUserId();
        setCurrentUserId(userId);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("New notification received:", payload);
          if (payload.new.user_id === currentUserId) {
            console.log("Adding notification to UI");
            setNotifications((prev) => [payload.new, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const getCurrentUserId = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting current user:", error);
        return null;
      }
      return user?.id;
    } catch (error) {
      console.error("Error in getCurrentUserId:", error);
      return null;
    }
  };

  const fetchNotifications = async () => {
    if (!currentUserId) {
      console.log("No current user ID yet, skipping fetch");
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching notifications for user:", currentUserId);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      console.log("Fetched notifications:", data);
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
      console.log("Unread count:", data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const createDueDateReminder = async (taskId, userId, daysUntilDue) => {
    const { data: task } = await supabase
      .from("tasks")
      .select("title, deadline")
      .eq("id", taskId)
      .single();

    if (!task) return;

    const dueDate = new Date(task.deadline);
    const message =
      daysUntilDue === 0
        ? `Task "${task.title}" sudah jatuh tempo hari ini!`
        : `Task "${task.title}" akan jatuh tempo dalam ${daysUntilDue} hari lagi.`;

    await supabase.from("notifications").insert([
      {
        user_id: userId,
        type: "due_date_reminder",
        title: "Pengingat Deadline",
        message: message,
        task_id: taskId,
      },
    ]);
  };

  const createTestNotification = async () => {
    if (!currentUserId) {
      console.error("No current user for test notification");
      return;
    }

    console.log("Creating test notification for user:", currentUserId);

    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id: currentUserId,
        type: "test",
        title: "Test Notification",
        message: "Ini adalah notifikasi test untuk memastikan sistem berfungsi",
      },
    ]);

    if (error) {
      console.error("Error creating test notification:", error);
    } else {
      console.log("Test notification created:", data);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createDueDateReminder,
    createTestNotification,
  };
}
