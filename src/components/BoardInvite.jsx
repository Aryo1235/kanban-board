import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import useBoardInvite from "../hooks/useBoardInvite";
import toast from "react-hot-toast";

export default function BoardInvite({ boardId, canEdit }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [userId, setUserId] = useState(null);
  const realtimeChannel = useRef(null);
  const {
    loading,
    error,
    members,
    fetchMembers,
    inviteMember,
    updateRole,
    removeMember,
  } = useBoardInvite(boardId);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, [boardId]);

  // Realtime subscription: update members jika ada perubahan di board_members
  useEffect(() => {
    // Unsubscribe channel lama jika ada
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }
    // Subscribe ke event board_members untuk boardId ini
    const channel = supabase
      .channel("realtime:board-invite-" + boardId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_members",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          // Hanya fetch jika ada perubahan di board ini
          fetchMembers();
          // Tampilkan notifikasi jika role user login berubah
          if (
            payload.eventType === "UPDATE" &&
            userId &&
            payload.new.user_id === userId &&
            payload.old.role !== payload.new.role
          ) {
            toast.success(
              `Role Anda di board ini berubah menjadi: ${payload.new.role}`
            );
          }
        }
      )
      .subscribe();
    realtimeChannel.current = channel;
    // Cleanup
    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [boardId, fetchMembers, userId]);

  useEffect(() => {
    // Ambil user id dari Supabase
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email wajib diisi");
    const ok = await inviteMember(email, role);
    if (ok) {
      toast.success("Undangan dikirim!");
      setEmail("");
      fetchMembers();
    } else if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6 w-full max-w-lg">
      <h3 className="text-lg font-bold text-white mb-2">Invite Member</h3>
      {canEdit && (
        <form onSubmit={handleInvite} className="flex gap-2 mb-4">
          <input
            type="email"
            className="flex-1 p-2 rounded bg-gray-700 text-white"
            placeholder="Email user"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="p-2 rounded bg-gray-700 text-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700"
            disabled={loading}
          >
            Invite
          </button>
        </form>
      )}
      <div>
        <h4 className="text-white font-semibold mb-1">Members:</h4>
        <ul>
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between text-white mb-1"
            >
              <span>
                {m.profiles?.email || m.user_id} - {m.role}{" "}
                {m.status === "pending" && (
                  <span className="text-yellow-400">(pending)</span>
                )}
              </span>
              {canEdit &&
                m.status !== "pending" &&
                m.role !== "owner" &&
                m.user_id !== userId && (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateRole(m.id, e.target.value).then(fetchMembers)
                      }
                      className="bg-gray-700 text-white rounded p-1 mx-2"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => removeMember(m.id).then(fetchMembers)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      Remove
                    </button>
                  </>
                )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
