import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import useBoardInvite from "../hooks/useBoardInvite";

export default function BoardInviteAccept({
  pendingInvites,
  loading,
  userId,
  fetchInvites,
}) {
  const { respondInvite } = useBoardInvite();

  const handleRespond = async (memberId, accept) => {
    const ok = await respondInvite(memberId, accept);
    if (ok) {
      toast.success(accept ? "Bergabung ke board!" : "Undangan ditolak.");
      fetchInvites(userId);
    } else {
      toast.error("Gagal memproses undangan");
    }
  };

  const handleDecline = async (memberId) => {
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("id", memberId);
    if (!error) {
      fetchInvites(userId);
    } else {
      console.log("Delete error:", error);
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
                onClick={() => handleDecline(inv.id)}
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
