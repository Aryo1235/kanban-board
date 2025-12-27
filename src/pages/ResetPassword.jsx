import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidResetLink, setIsValidResetLink] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    const checkResetLink = async () => {
      try {
        // Get URL parameters from both query string and hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        const type = urlParams.get("type") || hashParams.get("type");

        console.log("Checking reset link:", {
          type,
          hasQueryParams: urlParams.toString().length > 0,
          hasHashParams: hashParams.toString().length > 0,
          fullUrl: window.location.href,
        });

        // If this is a recovery type, consider it valid
        if (type === "recovery") {
          setIsValidResetLink(true);
          console.log("Valid recovery link detected");
        } else {
          // For development/testing, allow direct access but show warning
          console.log(
            "No recovery type, but allowing direct access for testing"
          );
          setIsValidResetLink(true);
          setError(
            "⚠️ Anda mengakses halaman ini secara langsung. Untuk reset password yang sebenarnya, gunakan link dari email."
          );
        }
      } catch (err) {
        console.error("Error checking reset link:", err);
        setError("Terjadi kesalahan saat memverifikasi link.");
      } finally {
        setCheckingLink(false);
      }
    };

    checkResetLink();
  }, [navigate]);

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (!password.trim()) {
      setError("Password baru wajib diisi");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Password berhasil diubah!");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      console.error("Error updating password:", err);
      setError(err.message || "Gagal mengubah password. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
            <p className="text-gray-300">
              Memverifikasi link reset password...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidResetLink) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Link Tidak Valid
            </h2>
            <p className="text-gray-300 mb-6">
              {error ||
                "Link reset password tidak valid atau sudah kadaluarsa."}
            </p>
            <p className="text-sm text-gray-400">
              Mengarahkan ke halaman login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Password Berhasil Diubah!
            </h2>
            <p className="text-gray-300 mb-6">
              Password Anda telah berhasil diubah. Anda akan diarahkan ke
              halaman utama dalam beberapa detik...
            </p>
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Lanjut ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400 text-sm">Masukkan password baru Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
              placeholder="Password baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              type="password"
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
              placeholder="Konfirmasi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/auth")}
            className="text-lime-400 hover:underline text-sm"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}
