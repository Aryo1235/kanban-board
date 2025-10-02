// pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Fallback: tukar code menjadi session jika masih ada "code=" di URL
        if (window.location.href.includes("code=")) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } finally {
        const { data: { session } } = await supabase.auth.getSession();
        navigate(session ? "/home" : "/", { replace: true });
      }
    })();
  }, [navigate]);

  return <p className="text-center text-white">Signing you in…</p>;
}
