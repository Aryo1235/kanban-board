import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [editMode, setEditMode] = useState(false); // mode view/edit
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        navigate("/");
        return;
      }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData);
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran (maks 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maks 2MB");
      return;
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Hanya file JPEG, PNG, dan WebP yang diperbolehkan");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url;

      // Upload file ke Supabase Storage jika ada file baru
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${profile.id}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Ambil public URL file terbaru
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = urlData.publicUrl + "?t=" + Date.now();

        // Update field avatar_url di tabel profiles
        await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", profile.id);
      }

      // Update profile dengan avatar URL baru
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          email: profile.email,
          avatar_url: avatarUrl,
          phone: profile.phone,
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setSaving(false);
      setAvatarFile(null);
      setAvatarPreview("");
      setEditMode(false);

      // Refresh profile
      const { data: refreshedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single();

      setProfile(refreshedProfile);

      alert("Profile berhasil diupdate!");
    } catch (error) {
      console.error("Error:", error);
      alert(`Gagal update profile: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile)
    return <div className="p-8 text-center">Profile not found.</div>;

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-lg mt-8 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        Lihat & Edit Profile
      </h2>
      <div className="flex justify-end mb-4">
        <button
          className={`px-4 py-2 rounded ${
            editMode ? "bg-gray-700" : "bg-lime-600"
          } text-white`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Lihat Saja" : "Edit Profile"}
        </button>
      </div>
      {editMode ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col items-center mb-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            ) : profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-600 rounded-full mb-2"></div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="mt-2 text-white bg-gray-700 rounded-full file:mr-4 file:py-2 file:px-4 file:roundedl-l-full file:bg-lime-600 file:text-white hover:file:bg-lime-700"
            />
          </div>
          <label className="text-white">
            Username:
            <input
              type="text"
              name="username"
              value={profile.username || ""}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white mt-1"
            />
          </label>
          <label className="text-white">
            Email:
            <input
              type="email"
              name="email"
              value={profile.email || ""}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white mt-1"
            />
          </label>
          <label className="text-white">
            Phone:
            <input
              type="text"
              name="phone"
              value={profile.phone || ""}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white mt-1"
            />
          </label>
          <button
            type="submit"
            className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 mt-4"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-600 rounded-full mb-2"></div>
            )}
          </div>
          <div className="text-white">
            <div className="mb-2">
              <span className="font-semibold">Username:</span>{" "}
              {profile.username || "-"}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Email:</span>{" "}
              {profile.email || "-"}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Phone:</span>{" "}
              {profile.phone || "-"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
