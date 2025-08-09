import AuthForm from "../components/AuthForm";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold mb-2">
        Selamat datang di Kanban Board!
      </h1>
      <p className="text-gray-300 text-center max-w-xl">
        Silakan pilih menu di atas untuk mengelola board Supabase atau board
        lokal.
        <br />
        Anda bisa logout dari mana saja melalui tombol di pojok kanan atas.
      </p>
    </div>
  );
}
