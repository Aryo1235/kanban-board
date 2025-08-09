import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Layout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (!session?.user) navigate("/");
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {user && (
        <header className="flex sticky top-0 items-center justify-between px-6 py-4 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center gap-8">
            <div
              className="text-xl font-bold text-lime-400 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              Kanban Board
            </div>
            <nav className="flex gap-4">
              <button
                className="text-lime-400 hover:underline"
                onClick={() => navigate("/supabase")}
              >
                Supabase Board
              </button>
              <button
                className="text-lime-400 hover:underline"
                onClick={() => navigate("/local")}
              >
                Local Board
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.email}</span>
            <button
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}
