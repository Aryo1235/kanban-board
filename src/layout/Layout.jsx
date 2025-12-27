import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MdOutlineViewKanban, MdHomeFilled } from "react-icons/md";
import NotificationDropdown from "../components/NotificationDropdown";
import { useNotifications } from "../hooks/useNotifications";

export default function Layout() {
  const [profile, setProfile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    let subscription;
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setProfile(null);
        return;
      }
      // Ambil data dari tabel profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(profileData);
    };
    fetchProfile();
    // Listen auth change
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setProfile(null);
        navigate("/");
      } else {
        fetchProfile();
      }
    });
    subscription = data?.subscription;
    return () => subscription?.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex overflow-hidden">
      <section className="flex gap-2">
        <aside className="w-64 bg-gray-800 p-6 border-r border-gray-700 hidden md:block">
          <div className="flex flex-col justify-between h-full">
            <div>
              <h2 className="text-lg font-bold mb-4">Boards</h2>
              <ul className="space-y-4 ">
                <Link
                  to="/home"
                  className="flex items-center hover:bg-gray-700 py-2 px-2 rounded-lg"
                >
                  <MdHomeFilled className="mr-2" size={28} />
                  <span className="text-white">Home</span>
                </Link>
                <Link
                  to="/supabase"
                  className="flex items-center hover:bg-gray-700 py-2 px-2 rounded-lg"
                >
                  <MdOutlineViewKanban className="mr-2" size={28} />
                  <span className="text-white">Board 1</span>
                </Link>
              </ul>
            </div>
            <div>
              <button
                className="mt-8 bg-red-500 py-2 px-2 rounded-md w-full cursor-pointer"
                onClick={async () => {
                  await supabase.auth.signOut();
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

      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="max-w-full h-20 p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <p className="text-sm text-gray-400">
              Welcome to your Kanban Board
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
            <div
              className="relative py-10"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              {profile && (
                <>
                  <span className="text-sm text-gray-400 cursor-pointer">
                    Welcome, {profile.username || profile.email}
                  </span>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded shadow-lg border border-gray-700 z-50 py-2">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                        onClick={() => navigate("/profile")}
                      >
                        Lihat & Edit Profile
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          navigate("/");
                        }}
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
