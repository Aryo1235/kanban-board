import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function LoginForm({ onAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getErrorMessage = (error) => {
    if (!error) return "";

    const message = error.message || error;

    if (message.includes("Invalid login credentials")) {
      return "Email atau password salah.";
    }
    if (message.includes("Email not confirmed")) {
      return "Email belum dikonfirmasi. Silakan cek inbox Anda.";
    }

    return "Terjadi kesalahan. Silakan coba lagi.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setError("");

    // Validate inputs
    let hasError = false;

    if (!email.trim()) {
      setEmailError("Email wajib diisi");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Format email tidak valid");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password wajib diisi");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (result.error) throw result.error;
      onAuth && onAuth();
      navigate("/home");
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setError("");
    setResetSent(false);

    // Validate email
    if (!email.trim()) {
      setEmailError("Email wajib diisi");
      return;
    } else if (!validateEmail(email)) {
      setEmailError("Format email tidak valid");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle email confirmation from hash
  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
          // Clear hash
          window.history.replaceState(null, null, window.location.pathname);
          setConfirmed(true);
        });
      }
    }
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session && location.pathname !== "/login" && !confirmed) {
        navigate("/home", { replace: true });
      }
    };
    checkSession();
  }, [navigate, location.pathname, confirmed]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-10 flex gap-6 justify-between rounded-md shadow-lg shadow-green-500 max-w-4xl w-full min-w-[900px]">
        <img
          src="/login.svg"
          alt="Login Illustration"
          className="max-w-md w-full h-auto"
        />
        {!showReset ? (
          <div className="flex flex-col items-center justify-center min-w-[320px] w-[320px]">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Login
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="w-full mb-3">
                <input
                  type="email"
                  className={`w-full p-2 rounded bg-gray-700 text-white border ${
                    emailError ? "border-red-500" : "border-gray-600"
                  } focus:outline-none focus:ring-1 ${
                    emailError ? "focus:ring-red-400" : "focus:ring-lime-400"
                  }`}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  required
                />
                {emailError && (
                  <div className="text-red-400 text-xs mt-1">{emailError}</div>
                )}
              </div>
              <div className="w-full mb-3">
                <input
                  type="password"
                  className={`w-full p-2 rounded bg-gray-700 text-white border ${
                    passwordError ? "border-red-500" : "border-gray-600"
                  } focus:outline-none focus:ring-1 ${
                    passwordError ? "focus:ring-red-400" : "focus:ring-lime-400"
                  }`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  required
                />
                {passwordError && (
                  <div className="text-red-400 text-xs mt-1">
                    {passwordError}
                  </div>
                )}
              </div>
              {confirmed && (
                <div className="w-full text-green-400 mb-2 text-sm bg-green-900/20 border border-green-800 rounded p-2">
                  Email confirmed! Please login with your credentials.
                </div>
              )}
              {error && (
                <div className="w-full text-red-400 mb-2 text-sm bg-red-900/20 border border-red-800 rounded p-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 cursor-pointer text-white font-bold py-2 px-4 rounded mb-1"
                disabled={loading}
              >
                {loading ? "Loading..." : "Login"}
              </button>
              <div className="flex my-2">
                <button
                  type="button"
                  className="w-full text-green-500 hover:underline text-sm mb-1 cursor-pointer text-start"
                  onClick={() => navigate("/register")}
                >
                  Belum punya akun? Register
                </button>
                <button
                  type="button"
                  className="w-48 cursor-pointer text-sky-400 hover:underline text-sm mb-1 text-end"
                  onClick={() => setShowReset(true)}
                >
                  Lupa password?
                </button>
              </div>
              <div className="flex items-center my-3">
                <div className="flex-grow h-px bg-gray-600" />
                <span className="mx-2 text-gray-400 text-xs">atau</span>
                <div className="flex-grow h-px bg-gray-600" />
              </div>
              <button
                type="button"
                className="w-full bg-white text-gray-800 font-bold py-2 px-4 rounded flex items-center justify-center gap-2 border cursor-pointer border-gray-300 hover:bg-gray-100"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_17_40)">
                    <path
                      d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.528 2.84-2.12 5.24-4.52 6.86v5.68h7.32c4.28-3.94 6.73-9.74 6.73-16.856z"
                      fill="#4285F4"
                    />
                    <path
                      d="M24.48 48c6.12 0 11.26-2.04 15.01-5.54l-7.32-5.68c-2.04 1.36-4.66 2.18-7.69 2.18-5.91 0-10.92-3.99-12.72-9.36H4.23v5.86C7.97 43.98 15.62 48 24.48 48z"
                      fill="#34A853"
                    />
                    <path
                      d="M11.76 29.6c-.48-1.36-.76-2.8-.76-4.28s.28-2.92.76-4.28v-5.86H4.23A23.97 23.97 0 0 0 0 24c0 3.98.96 7.75 2.66 11.06l9.1-5.46z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M24.48 9.52c3.34 0 6.32 1.15 8.68 3.4l6.48-6.48C35.74 2.04 30.6 0 24.48 0 15.62 0 7.97 4.02 4.23 10.14l9.1 5.86c1.8-5.37 6.81-9.36 12.72-9.36z"
                      fill="#EA4335"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_17_40">
                      <path fill="#fff" d="M0 0h48v48H0z" />
                    </clipPath>
                  </defs>
                </svg>
                Lanjutkan dengan Google
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <form onSubmit={handleResetPassword}>
              <div className="w-full mb-4">
                <input
                  type="email"
                  className={`w-full p-2 rounded bg-gray-700 text-white border ${
                    emailError ? "border-red-500" : "border-gray-600"
                  } focus:outline-none focus:ring-1 ${
                    emailError ? "focus:ring-red-400" : "focus:ring-lime-400"
                  }`}
                  placeholder="Email untuk reset password"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  required
                />
                {emailError && (
                  <div className="text-red-400 text-xs mt-1">{emailError}</div>
                )}
              </div>
              {resetSent && (
                <div className="text-green-400 mb-2 text-sm bg-green-900/20 border border-green-800 rounded p-2">
                  Link reset password telah dikirim ke email Anda.
                </div>
              )}
              {error && (
                <div className="text-red-400 mb-2 text-sm bg-red-900/20 border border-red-800 rounded p-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
                disabled={loading}
              >
                {loading ? "Loading..." : "Kirim Link Reset Password"}
              </button>
              <button
                type="button"
                className="w-full text-lime-400 hover:underline text-sm"
                onClick={() => {
                  setShowReset(false);
                  setResetSent(false);
                  setError("");
                }}
              >
                Kembali ke Login
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
