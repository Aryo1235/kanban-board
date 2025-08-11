import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function RealtimeTest() {
  useEffect(() => {
    // Subscribe ke semua perubahan pada tabel test_realtime
    const channel = supabase
      .channel("realtime:test_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "test_realtime" },
        (payload) => {
          console.log("Realtime event test_realtime:", payload);
        }
      )
      .subscribe((status) => {
        console.log("Channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ color: "white", background: "#222", padding: 24 }}>
      <h2>Realtime Test</h2>
      <p>
        Buka console, lalu insert/update/delete data di tabel{" "}
        <b>test_realtime</b> dari Supabase Dashboard.
        <br />
        Jika event masuk, log akan muncul di sini.
      </p>
    </div>
  );
}
