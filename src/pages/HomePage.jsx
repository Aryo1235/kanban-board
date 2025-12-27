import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import BoardInviteAccept from "../components/BoardInviteAccept";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const channelRef = useRef(null);

  // Fetch undangan
  const fetchInvites = async (userId) => {
    setLoadingInvites(true);
    const { data, error } = await supabase
      .from("board_members")
      .select("*, boards: board_id (name)")
      .eq("user_id", userId)
      .eq("status", "pending");
    setPendingInvites(data || []);
    setLoadingInvites(false);
  };

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      if (currentUser) fetchInvites(currentUser.id);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) fetchInvites(session.user.id);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  // Subscribe realtime undangan
  useEffect(() => {
    if (!user) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase
      .channel("realtime:invite-accept")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_members" },
        (payload) => {
          if (
            payload.new?.user_id === user.id ||
            payload.old?.user_id === user.id
          ) {
            fetchInvites(user.id);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold mb-2">
        Selamat datang di Kanban Board!
      </h1>
      <BoardInviteAccept
        pendingInvites={pendingInvites}
        loading={loadingInvites}
        userId={user?.id}
        fetchInvites={fetchInvites}
      />
      <p className="text-gray-300 text-center max-w-xl">
        Silakan pilih menu di atas untuk mengelola board Supabase atau board
        lokal.
        <br />
        Anda bisa logout dari mana saja melalui tombol di pojok kanan atas.
      </p>
    </div>
  );
}
