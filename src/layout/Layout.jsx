import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MdOutlineViewKanban, MdHomeFilled } from "react-icons/md";
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
    <div className="min-h-screen bg-gray-900 text-white flex overflow-hidden">
      {user && (
        <section className="flex gap-2">
          <aside className="w-64  bg-gray-800 p-6 border-r border-gray-700 hidden md:block">
            <div className="flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lg font-bold mb-4">Boards</h2>

                <ul className="space-y-4 ">
                  <Link
                    to="/home"
                    className="flex  items-center hover:bg-gray-700 py-2 px-2 rounded-lg"
                  >
                    <MdHomeFilled className=" mr-2" size={28} />
                    <span className="text-white ">Home</span>
                  </Link>

                  <Link
                    to="/supabase"
                    className="flex  items-center  hover:bg-gray-700 py-2 px-2 rounded-lg"
                  >
                    <MdOutlineViewKanban className=" mr-2" size={28} />
                    <span className="text-white ">Board 1</span>
                  </Link>
                </ul>
              </div>
              <div>
                <button
                  className="mt-8 bg-red-500 py-2 px-2 rounded-md w-full cursor-pointer"
                  onClick={() => {
                    supabase.auth.signOut();
                    navigate("/");
                  }}
                  title="Log out"
                >
                  Log out
                </button>
              </div>
            </div>
          </aside>
        </section>
      )}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="max-w-full h-20  p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <p className="text-sm text-gray-400">
              Welcome to your Kanban Board
            </p>
          </div>
          <div>
            {user && (
              <span className="text-sm text-gray-400">
                Welcome, {user.email}
              </span>
            )}
          </div>
        </header>
        <main className="container mx-auto px-4 py-4 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
