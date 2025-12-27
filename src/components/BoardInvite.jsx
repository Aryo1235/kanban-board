import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import ModalProfileMembers from "./ModalProfileMembers";
import ModalInviteMemberDropdown from "./ModalInviteMemberDropdown";

export default function BoardInvite({
  boardId,
  canEdit,
  isOwner,
  members,
  loading,
  error,
  fetchMembers,
  inviteMember,
  updateRole,
  removeMember,
  clearError,
  userId,
}) {
  // State/modal untuk UI saja
  const [selectedMember, setSelectedMember] = useState(null);
  const [anchorPos, setAnchorPos] = useState(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteAnchor, setInviteAnchor] = useState(null);
  const realtimeChannel = useRef(null);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, [boardId, members.length]);

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
        },
        (payload) => {
          console.log("Realtime event:", payload);
          fetchMembers();
          // Hanya fetch jika ada perubahan di board ini
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

  return (
    <>
      <div className="w-full flex justify-center items-center h-12 mb-32">
        <div className=" w-full  flex gap-4 items-center px-2">
          <div className="bg-fuchsia-300 flex items-center gap-2 px-4 py-2 rounded-md">
            {members
              .filter((member) => member.status === "accepted")
              .slice(0, 5)
              .map((member) => (
                <button
                  key={member.id}
                  title={member.profiles?.email || "avatar"}
                  onClick={(e) => {
                    setSelectedMember(member);
                    setOpenInvite(false);
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
          <div className="flex items-center gap-4">
            {isOwner && (
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
            )}
          </div>
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
        isOwner={isOwner}
        inviteMember={inviteMember}
        members={members}
        userId={userId}
        updateRole={updateRole}
        removeMember={removeMember}
        fetchMembers={fetchMembers}
        loading={loading}
        error={error}
        clearError={clearError}
      />
    </>
  );
}
