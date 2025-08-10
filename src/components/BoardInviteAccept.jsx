import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import useBoardInvite from "../hooks/useBoardInvite";
import toast from "react-hot-toast";

export default function BoardInviteAccept() {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchInvites = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }
      setUserId(userData.user.id);
      // Ambil undangan pending untuk user ini
      const { data, error } = await supabase
        .from("board_members")
        .select("*, boards: board_id (name)")
        .eq("user_id", userData.user.id)
        .eq("status", "pending");
      setPendingInvites(data || []);
      setLoading(false);
    };
    fetchInvites();
  }, []);

  const { respondInvite } = useBoardInvite();

  const handleRespond = async (memberId, accept) => {
    const ok = await respondInvite(memberId, accept);
    if (ok) {
      toast.success(accept ? "Bergabung ke board!" : "Undangan ditolak.");
      setPendingInvites((inv) => inv.filter((i) => i.id !== memberId));
    } else {
      toast.error("Gagal memproses undangan");
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;
  if (pendingInvites.length === 0)
    return <div className="text-gray-400">Tidak ada undangan board.</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6 w-full max-w-lg">
      <h3 className="text-lg font-bold text-white mb-2">Undangan Board</h3>
      <ul>
        {pendingInvites.map((inv) => (
          <li
            key={inv.id}
            className="flex items-center justify-between text-white mb-2"
          >
            <span>
              Board: <b>{inv.boards?.name || inv.board_id}</b> - Role:{" "}
              {inv.role}
            </span>
            <span>
              <button
                className="bg-lime-600 text-white px-3 py-1 rounded mr-2"
                onClick={() => handleRespond(inv.id, true)}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleRespond(inv.id, false)}
              >
                Decline
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
