import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function useBoardInvite(boardId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState([]);

  // Fetch all members for this board
  const fetchMembers = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("board_members")
      .select("*, profiles: user_id (email, username)")
      .eq("board_id", boardId);
    if (error) setError(error.message);
    console.log(error);
    setMembers(data || []);
    setLoading(false);
  };

  // Invite member by email and role
  const inviteMember = async (email, role) => {
    setLoading(true);
    setError("");
    // Cari user_id dari tabel profiles (bisa diakses dari client)
    let userData = null,
      userError = null;
    try {
      console.log("Mencari user dengan email:", email);
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      userData = data;
      userError = error;
      console.log("User data:", userData);
      console.log("User error:", userError);
    } catch (e) {
      userError = e;
    }
    if (userError) {
      console.error("Error query profiles:", userError);
      setError("Terjadi error saat mencari user");
      setLoading(false);
      return false;
    }
    if (!userData) {
      setError("User tidak ditemukan");
      setLoading(false);
      return false;
    }
    // Insert ke board_members dengan status 'pending'
    const { error: insertError } = await supabase
      .from("board_members")
      .insert([
        { board_id: boardId, user_id: userData.id, role, status: "pending" },
      ]);
    if (insertError) setError(insertError.message);
    setLoading(false);
    return !insertError;
  };

  // --- Penjelasan opsional jika ingin pakai tabel profiles ---
  // Skema profiles (public/profiles):
  // create table public.profiles (
  //   id uuid primary key references auth.users(id) on delete cascade,
  //   email text unique,
  //   username text,
  //   avatar_url text,
  //   ...
  // );
  //
  // - profiles.id = auth.users.id (1:1 mapping)
  // - profiles.email bisa diisi via trigger dari auth.users (atau manual sync)
  // - Untuk auth, tetap login/register pakai Supabase Auth (email/password, OAuth, dsb)
  // - profiles hanya untuk data tambahan user, bukan untuk autentikasi
  // - Untuk query user by email, bisa ke profiles.email (lebih mudah diakses dari client)
  // - Untuk insert ke board_members, tetap pakai user_id (uuid)
  // Update role
  const updateRole = async (memberId, newRole) => {
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("board_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) setError(error.message);
    setLoading(false);
    return !error;
  };

  // Remove member
  const removeMember = async (memberId) => {
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("id", memberId);
    if (error) setError(error.message);
    setLoading(false);
    return !error;
  };

  // Accept/decline invitation (for invited user)
  const respondInvite = async (memberId, accept) => {
    setLoading(true);
    setError("");
    if (accept) {
      const { error } = await supabase
        .from("board_members")
        .update({ status: "accepted" })
        .eq("id", memberId);
      if (error) setError(error.message);
      setLoading(false);
      return !error;
    } else {
      // decline: hapus row
      const { error } = await supabase
        .from("board_members")
        .delete()
        .eq("id", memberId);
      if (error) setError(error.message);
      setLoading(false);
      return !error;
    }
  };

  return {
    loading,
    error,
    members,
    fetchMembers,
    inviteMember,
    updateRole,
    removeMember,
    respondInvite,
  };
}
