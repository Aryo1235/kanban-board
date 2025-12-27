import { useState, useRef, useEffect } from "react";
import { FiUser, FiUserPlus, FiX } from "react-icons/fi";

export default function TaskAssignmentDropdown({
  task,
  boardMembers,
  onAssign,
  canEdit,
  currentUserId,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // approximate height
      const viewportHeight = window.innerHeight;

      // Check if there's enough space below
      if (rect.bottom + dropdownHeight > viewportHeight) {
        // Show above button
        setDropdownPosition({
          top: rect.top - dropdownHeight - 5,
          left: rect.left,
        });
      } else {
        // Show below button
        setDropdownPosition({
          top: rect.bottom + 5,
          left: rect.left,
        });
      }
    }
  }, [isOpen]);

  const assignedUser = boardMembers.find((m) => m.user_id === task.assigned_to);

  const handleAssign = async (userId) => {
    await onAssign(task.id, userId, currentUserId);
    setIsOpen(false);
  };

  const handleUnassign = async () => {
    await onAssign(task.id, null, currentUserId);
    setIsOpen(false);
  };

  if (!canEdit) {
    // Read-only mode for viewers
    return assignedUser ? (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <FiUser size={12} />
        <span className="truncate max-w-24">
          {assignedUser.profiles?.full_name || assignedUser.profiles?.email}
        </span>
      </div>
    ) : null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 transition-colors min-w-20"
      >
        {assignedUser ? (
          <>
            <FiUser size={12} />
            <span className="truncate max-w-24 text-xs">
              {assignedUser.profiles?.full_name || assignedUser.profiles?.email}
            </span>
          </>
        ) : (
          <>
            <FiUserPlus size={12} />
            <span className="text-xs">Assign</span>
          </>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] min-w-56 bg-gray-800 border border-gray-600 rounded shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="p-2 border-b border-gray-600 text-xs text-gray-400">
            Assign kepada:
          </div>

          {boardMembers.map((member) => (
            <button
              key={member.user_id}
              onClick={() => handleAssign(member.user_id)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-sm ${
                task.assigned_to === member.user_id ? "bg-gray-700" : ""
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-medium">
                {(member.profiles?.full_name ||
                  member.profiles?.email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate max-w-32">
                  {member.profiles?.full_name || member.profiles?.email}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {member.role}
                </div>
              </div>
              {task.assigned_to === member.user_id && (
                <span className="text-green-400">✓</span>
              )}
            </button>
          ))}

          {assignedUser && (
            <button
              onClick={handleUnassign}
              className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-sm text-red-400 border-t border-gray-600"
            >
              <FiX size={14} />
              Unassign
            </button>
          )}
        </div>
      )}
    </div>
  );
}
