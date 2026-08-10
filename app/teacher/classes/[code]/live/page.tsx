"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { StudentSessionRow } from "@/lib/types";
import { ArrowLeft, Maximize2, QrCode, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function LiveLeaderboardPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const router = useRouter();

  const [sessions, setSessions] = useState<StudentSessionRow[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullQR, setShowFullQR] = useState(false);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("student_sessions")
      .select("*")
      .eq("class_code", code)
      .order("completed_at", { ascending: false });

    setSessions((data as StudentSessionRow[]) ?? []);
    setIsLoading(false);
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

  const sortedLeaderboard = [...sessions].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

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
              Papan Peringkat - {code}
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Peringkat real-time diurutkan berdasarkan Total Skor tertinggi. Layar ini cocok ditampilkan ke proyektor kelas.
          </p>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition text-sm font-semibold text-slate-300"
        >
          <Maximize2 className="w-4 h-4" /> {isFullscreen ? "Keluar Full Screen" : "Full Screen"}
        </button>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col gap-6 pt-4">

        {/* TOP BANNER: Class Code & QR */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl gap-6">
          <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
            <p className="text-slate-400 font-display font-bold">Kode Kelas</p>
            <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-widest bg-slate-800/50 px-6 md:px-8 py-3 md:py-4 rounded-2xl border border-slate-700">{code}</h2>
            <p className="text-sm text-slate-500 mt-2">Buka <b className="text-slate-300">getcalmer.site/game</b> dan masukkan kode ini.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-slate-400 font-display font-bold flex items-center justify-end gap-2 mb-1">
                Scan untuk Bergabung
              </p>
              <p className="text-xs text-slate-500">Gunakan kamera HP</p>
            </div>
            <div
              className="bg-white p-3 rounded-2xl cursor-pointer hover:scale-105 transition shadow-lg relative group"
              onClick={() => setShowFullQR(true)}
              title="Perbesar QR Code"
            >
              <QRCodeSVG
                value={`https://getcalmer.site/game?code=${code}`}
                size={120}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"H"}
                includeMargin={false}
              />
              <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Maximize2 className="text-white w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN: Leaderboard */}
        <div className="w-full">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400 mb-4"></div>
              <p className="font-display font-bold text-xl text-slate-400">Memuat data live...</p>
            </div>
          ) : sortedLeaderboard.length === 0 ? (
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
                    <th className="px-6 py-4 font-display font-bold text-right">Skor Kuis</th>
                    <th className="px-6 py-4 font-display font-bold text-right">Total Skor</th>
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
                        <td className="px-6 py-5 font-display text-teal-400 text-right text-2xl">{session.fact_score_final}</td>
                        <td className="px-6 py-5 font-display text-indigo-400 text-right text-2xl">{session.quiz_score}</td>
                        <td className="px-6 py-5 font-display font-extrabold text-amber-400 text-right text-3xl">{session.total_score}</td>
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

      {showFullQR && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setShowFullQR(false)}
        >
          <button
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
            onClick={(e) => { e.stopPropagation(); setShowFullQR(false); }}
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeSVG
              value={`https://getcalmer.site/game?code=${code}`}
              size={Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.6 : 400, 600)}
              bgColor={"#ffffff"}
              fgColor={"#0f172a"}
              level={"H"}
              includeMargin={false}
            />
            <div className="mt-8 text-center">
              <h2 className="text-4xl sm:text-6xl font-display font-black text-slate-800 tracking-widest mb-2">{code}</h2>
              <p className="text-lg text-slate-500 font-body">Scan atau buka <b className="text-teal-600">getcalmer.site</b></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
