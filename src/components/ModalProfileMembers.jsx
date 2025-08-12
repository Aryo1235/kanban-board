import React from "react";

export default function ModalProfileMembers({
  anchorPos,
  open,
  onClose,
  member,
}) {
  if (!open || !member) return null;
  console.log("ModalProfileMembers member:", member);
  return (
    <div
      className="fixed z-30"
      style={{
        top: anchorPos.top + 16,
        left: anchorPos.left,
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[200px] max-w-xs relative">
        <button
          className="absolute top-2 right-2  text-gray-500 hover:text-gray-700 text-3xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center">
          {member.profiles?.avatar_url ? (
            <img
              src={member.profiles.avatar_url}
              alt={member.profiles.email || "avatar"}
              className="w-16 h-16 rounded-full object-cover mb-2"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-300 rounded-full mb-2"></div>
          )}
          <div className="text-lg font-bold mb-1 text-gray-700">
            {member.profiles.username || "bokdasdaw"}
          </div>
          <div className="text-justify">
            <div className="text-sm text-gray-500">
              Role : {member.role || "-"}
            </div>
            <div className="text-sm text-gray-500">
              Email : {member.profiles?.email || member.user_id}
            </div>
            <div className="text-sm text-gray-500">
              Phone : {member.profiles?.phone || "bokaw"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
