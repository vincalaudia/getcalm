"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { StudentSessionRow } from "@/lib/types";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LiveLeaderboardPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const router = useRouter();

  const [sessions, setSessions] = useState<StudentSessionRow[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("student_sessions")
      .select("*")
      .eq("class_code", code)
      .order("completed_at", { ascending: false });

    setSessions((data as StudentSessionRow[]) ?? []);
  }, [code]);

  useEffect(() => {
    fetchSessions();

    const interval = setInterval(() => {
      fetchSessions();
    }, 20000);

    const channel = supabase
      .channel(`realtime-class-live-${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_sessions", filter: `class_code=eq.${code}` },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [code, fetchSessions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const sortedLeaderboard = [...sessions].sort((a, b) => b.fact_score_final - a.fact_score_final);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 font-body text-xs font-semibold text-teal-400 hover:underline w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-white">
              Papan Peringkat Live - Kelas {code}
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Peringkat real-time diurutkan berdasarkan Skor Fakta tertinggi. Layar ini cocok ditampilkan ke proyektor kelas.
          </p>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition text-sm font-semibold text-slate-300"
        >
          <Maximize2 className="w-4 h-4" /> {isFullscreen ? "Keluar Full Screen" : "Full Screen"}
        </button>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full">
        {sortedLeaderboard.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <span className="text-5xl mb-4">📭</span>
            <p className="font-display font-bold text-xl text-slate-400">Belum ada siswa yang menyelesaikan simulasi.</p>
            <p className="font-body text-slate-500 text-sm mt-2">Daftar ini akan diperbarui otomatis saat ada siswa yang selesai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 bg-slate-900">
                  <th className="px-6 py-4 font-display font-bold">Peringkat</th>
                  <th className="px-6 py-4 font-display font-bold">Nama Siswa</th>
                  <th className="px-6 py-4 font-display font-bold text-right">Skor Fakta</th>
                  <th className="px-6 py-4 font-display font-bold text-right">Batere Fokus</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((session, index) => {
                  const rank = index + 1;
                  const rankBadge = rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : `#${rank}`;
                  const bat = session.focus_battery_final;
                  const batColor = bat > 60 ? "text-emerald-400" : bat > 30 ? "text-amber-400" : "text-rose-400";

                  return (
                    <tr key={session.id} className="border-b border-slate-800/50 hover:bg-slate-800 transition">
                      <td className="px-6 py-5 font-display font-extrabold text-white w-32 text-xl">{rankBadge}</td>
                      <td className="px-6 py-5 font-body font-bold text-white text-lg">
                        {session.student_name}
                        {session.game_mode === "HARD" && (
                          <span className="ml-3 text-xs px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            🔥 Tantangan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 font-display font-extrabold text-teal-400 text-right text-2xl">{session.fact_score_final}</td>
                      <td className={`px-6 py-5 font-body font-bold ${batColor} text-right text-xl`}>{bat}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
