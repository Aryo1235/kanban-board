import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import useBoardInvite from "../hooks/useBoardInvite";
import toast from "react-hot-toast";
import ModalProfileMembers from "./ModalProfileMembers";
import ModalInviteMemberDropdown from "./ModalInviteMemberDropdown";

export default function BoardInvite({ boardId, canEdit }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [userId, setUserId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [anchorPos, setAnchorPos] = useState(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteAnchor, setInviteAnchor] = useState(null);
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
  console.log("BoardInvite members:", members);
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, [boardId]);
  console.log(email);
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
    <>
      <div className="w-full flex justify-center items-center h-12 mb-32">
        <div className=" w-full  flex gap-4 justify-start items-center px-2">
          <div className="bg-fuchsia-300 flex items-center gap-2 px-4 py-2 rounded-md">
            {members.slice(0, 5).map((member) => (
              <button
                key={member.id}
                title={member.profiles?.email || "avatar"}
                onClick={(e) => {
                  setSelectedMember(member);
                  setOpenInvite(false); // Tutup modal invite
                  const rect = e.currentTarget.getBoundingClientRect();
                  setAnchorPos({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                  });
                }}
                className="focus:outline-none cursor-pointer"
                type="button"
              >
                {member.profiles?.avatar_url ? (
                  <img
                    src={member.profiles.avatar_url}
                    alt={member.profiles.email || "avatar"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                )}
              </button>
            ))}
            {members.length > 5 && (
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                +{members.length - 5}
              </div>
            )}
          </div>
          <button
            className="py-3 px-4 bg-amber-300 rounded-md text-md text-white"
            onClick={(e) => {
              setOpenInvite(true);
              setSelectedMember(null); // Tutup modal profile
              const rect = e.currentTarget.getBoundingClientRect();
              setInviteAnchor({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
              });
            }}
          >
            Invite a new member
          </button>
        </div>
      </div>
      <ModalProfileMembers
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        anchorPos={anchorPos}
      />
      <ModalInviteMemberDropdown
        open={openInvite}
        anchorPos={inviteAnchor}
        onClose={() => setOpenInvite(false)}
        canEdit={canEdit}
        inviteMember={inviteMember}
        members={members}
        userId={userId}
        updateRole={updateRole}
        removeMember={removeMember}
        fetchMembers={fetchMembers}
        loading={loading}
        error={error}
      />
    </>
  );
}
