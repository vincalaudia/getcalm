"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Download,
  ArrowLeft,
  Trophy,
  Target,
  Heart,
  AlertTriangle,
  Radio,
  BarChart2,
  Users,
  RefreshCw,
  Zap,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  Copy,
  Check,
  Maximize2,
  Battery,
  BookOpen,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { StudentSessionRow, ClassRow, VideoRow, QuizQuestionRow } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

type TabType = "students" | "live" | "analytics";

interface VideoStat {
  video_id: string;
  video_url?: string;
  author_username?: string;
  category?: string;
  caption?: string;
  total_secs: number;
  avg_secs: number;
}

export default function ClassDetailPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [sessions, setSessions] = useState<StudentSessionRow[]>([]);
  const [videoStats, setVideoStats] = useState<VideoStat[]>([]);
  const [quizStats, setQuizStats] = useState<{
    question_id: number;
    question_text: string;
    incorrect_count: number;
    correct_count: number;
    correct_index: number;
    options: string[];
    selected_distribution: Record<number, number>;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch all class data efficiently in a single batch
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    const [{ data: cls }, { data: sess }, { data: views }, { data: vids }, { data: qAnswers }, { data: qQuestions }] = await Promise.all([
      supabase.from("classes").select("*").eq("class_code", code).single(),
      supabase.from("student_sessions").select("*").eq("class_code", code).order("completed_at", { ascending: false }),
      supabase.from("student_video_views").select("*").eq("class_code", code),
      supabase.from("videos").select("*"),
      supabase.from("student_quiz_answers").select("*").eq("class_code", code),
      supabase.from("quiz_questions").select("*"),
    ]);

    if (cls) setClassInfo(cls as ClassRow);
    const sessionList = (sess as StudentSessionRow[]) ?? [];
    setSessions(sessionList);

    // Map videos details
    const vMap: Record<string, VideoRow> = {};
    ((vids as VideoRow[]) ?? []).forEach((v) => {
      vMap[v.id] = v;
    });

    // Compute video watch stats
    const statsMap: Record<string, { total_secs: number; count: number }> = {};
    ((views as { video_id: string; watched_secs: number }[]) ?? []).forEach((vw) => {
      if (!statsMap[vw.video_id]) {
        statsMap[vw.video_id] = { total_secs: 0, count: 0 };
      }
      statsMap[vw.video_id].total_secs += vw.watched_secs;
      statsMap[vw.video_id].count += 1;
    });

    const calculatedStats: VideoStat[] = Object.entries(statsMap).map(([vid, data]) => ({
      video_id: vid,
      video_url: vMap[vid]?.video_url,
      author_username: vMap[vid]?.author_username,
      category: vMap[vid]?.category,
      caption: vMap[vid]?.caption,
      total_secs: data.total_secs,
      avg_secs: Math.round(data.total_secs / (sessionList.length || 1)),
    }));

    calculatedStats.sort((a, b) => b.avg_secs - a.avg_secs);
    setVideoStats(calculatedStats);

    // Compute Quiz Stats
    const qMap: Record<number, QuizQuestionRow> = {};
    ((qQuestions as QuizQuestionRow[]) ?? []).forEach(q => {
      qMap[q.id] = q;
    });

    const qs: typeof quizStats = Object.values(qMap).map(q => {
      let incorrect_count = 0;
      let correct_count = 0;
      const selected_distribution: Record<number, number> = {};

      ((qAnswers as unknown as { question_id: number; is_correct: boolean; selected_index: number | null }[]) ?? []).forEach(a => {
        if (a.question_id === q.id) {
          if (!a.is_correct) {
            incorrect_count += 1;
            if (a.selected_index != null) {
              selected_distribution[a.selected_index] = (selected_distribution[a.selected_index] || 0) + 1;
            }
          } else {
            correct_count += 1;
          }
        }
      });

      return {
        question_id: q.id,
        question_text: q.question,
        options: q.options,
        correct_index: q.correct_index,
        incorrect_count,
        correct_count,
        selected_distribution
      };
    });
    qs.sort((a, b) => b.incorrect_count - a.incorrect_count);
    setQuizStats(qs);

    setLastUpdated(new Date());
    setIsLoading(false);
    setIsRefreshing(false);
  }, [code]);

  // Event-driven live dashboard:
  // Subscribe to INSERT (new student joins) AND UPDATE (score/battery changes every 5s).
  // Low-frequency 10s fallback handles any edge cases where Realtime misses an event.
  useEffect(() => {
    fetchData();

    // 10-second low frequency fallback
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    // Realtime subscription — fires on INSERT (student joins) and UPDATE (live score push)
    const channel = supabase
      .channel(`realtime-class-${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_sessions", filter: `class_code=eq.${code}` },
        () => { fetchData(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "student_sessions", filter: `class_code=eq.${code}` },
        () => { fetchData(); }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [code, fetchData]);

  const copyClassCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportCSV = () => {
    if (!sessions.length) return;
    const headers = [
      "Nama Siswa",
      "Mode Permainan",
      "Baterai Akhir (%)",
      "Skor Fakta",
      "Skor Kuis",
      "Total Skor",
      "Total Interaksi Benar",
      "Total Interaksi Salah",
      "Jumlah Share",
      "Jumlah Share Benar",
      "Jumlah Share Salah",
      "Laporan Hoaks (Total)",
      "Laporan AI (Total)",
      "Waktu Selesai"
    ];
    const rows = sessions.map((s) => [
      s.student_name,
      s.game_mode,
      s.focus_battery_final,
      s.fact_score_final,
      s.quiz_score,
      s.total_score,
      s.total_correct_actions,
      s.total_incorrect_actions,
      s.shares_count,
      s.shares_correct,
      s.shares_incorrect,
      s.hoax_reports_count,
      s.ai_reports_count,
      new Date(s.completed_at).toLocaleString("id-ID"),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GetCalm_Kelas_${code}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Aggregated analytics metrics
  const avg = (key: keyof StudentSessionRow) =>
    sessions.length ? Math.round(sessions.reduce((s, r) => s + ((r as any)[key] as number ?? 0), 0) / sessions.length) : 0;

  const totalCorrect = sessions.reduce((acc, s) => acc + (s.total_correct_actions || 0), 0);
  const totalIncorrect = sessions.reduce((acc, s) => acc + (s.total_incorrect_actions || 0), 0);
  const totalDecisions = totalCorrect + totalIncorrect;

  const accuracy = totalDecisions > 0 ? Math.round((totalCorrect / totalDecisions) * 100) : 0;

  const sortedLeaderboard = [...sessions].sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
  const top3FactStudents = [...sessions].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)).slice(0, 3);
  const top4LongestVideos = videoStats.slice(0, 4);

  const statLikes = {
    correct: sessions.reduce((s, r) => s + (r.likes_correct || 0), 0),
    incorrect: sessions.reduce((s, r) => s + (r.likes_incorrect || 0), 0),
    total: sessions.reduce((s, r) => s + (r.likes_count || 0), 0),
  };
  const statShares = {
    correct: sessions.reduce((s, r) => s + (r.shares_correct || 0), 0),
    incorrect: sessions.reduce((s, r) => s + (r.shares_incorrect || 0), 0),
    total: sessions.reduce((s, r) => s + (r.shares_count || 0), 0),
  };
  const statHoax = {
    correct: sessions.reduce((s, r) => s + (r.hoax_reports_correct || 0), 0),
    incorrect: sessions.reduce((s, r) => s + (r.hoax_reports_incorrect || 0), 0),
    total: sessions.reduce((s, r) => s + (r.hoax_reports_count || 0), 0),
  };
  const statAI = {
    correct: sessions.reduce((s, r) => s + (r.ai_reports_correct || 0), 0),
    incorrect: sessions.reduce((s, r) => s + (r.ai_reports_incorrect || 0), 0),
    total: sessions.reduce((s, r) => s + (r.ai_reports_count || 0), 0),
  };

  const highBatteryCount = sessions.filter((s) => s.focus_battery_final >= 60).length;
  const medBatteryCount = sessions.filter((s) => s.focus_battery_final >= 30 && s.focus_battery_final < 60).length;
  const lowBatteryCount = sessions.filter((s) => s.focus_battery_final < 30).length;

  const classTP = sessions.reduce((acc, s) => acc + (s.true_positives || 0), 0);
  const classTN = sessions.reduce((acc, s) => acc + (s.true_negatives || 0), 0);
  const classFP = sessions.reduce((acc, s) => acc + (s.false_positives || 0), 0);
  const classFN = sessions.reduce((acc, s) => acc + (s.false_negatives || 0), 0);

  const literacyData = [
    { name: "Kritis & Akurat", value: classTP + classTN, color: "#10B981" },
    { name: "Mudah Terkecoh", value: classFN, color: "#F43F5E" },
    { name: "Terlalu Curiga", value: classFP, color: "#F59E0B" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
        <p className="font-body text-sm text-slate-500 font-medium">Memuat dasbor kelas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── CLASS HEADER ── */}
      <div className="bg-white rounded-3xl p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: "#D1F0EB" }}>
        <div>
          <button
            onClick={() => router.push("/teacher/classes")}
            className="flex items-center gap-1 font-body text-xs font-semibold mb-2 hover:underline text-teal-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Kelas
          </button>
          <h1 className="font-display font-extrabold text-2xl" style={{ color: "#1A2A5E" }}>
            {classInfo?.class_name ?? code}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
              <span className="font-mono font-bold text-xs text-teal-700 tracking-wider">KODE: {code}</span>
              <button onClick={copyClassCode} className="text-teal-600 hover:text-teal-800">
                {copiedCode ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-xs text-slate-400">
              Diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
            title="Update Data Hemat API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!sessions.length}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-bold text-xs text-slate-900 transition disabled:opacity-40"
            style={{ background: "#C6F516", boxShadow: "0 3px 0 #8CBE11" }}
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── 3 NAVIGATION TABS ── */}
      <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm" style={{ borderColor: "#D1F0EB" }}>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex-1 py-3 rounded-xl font-display font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === "students"
            ? "bg-teal-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Users className="w-4 h-4" /> Data Per Siswa ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab("live")}
          className={`flex-1 py-3 rounded-xl font-display font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === "live"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Radio className="w-4 h-4 text-red-400 animate-pulse" /> Live Leaderboard
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-3 rounded-xl font-display font-bold text-sm transition flex items-center justify-center gap-2 ${activeTab === "analytics"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
            }`}
        >
          <BarChart2 className="w-4 h-4 text-amber-300" /> Dasbor Analisis Kelas
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATA PER SISWA                                                      */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Trophy className="w-5 h-5" />, label: "Rata-rata Total Skor", value: avg("total_score"), bg: "#C6F516", fg: "#1A2A5E" },
              { icon: <Battery className="w-5 h-5" />, label: "Rata-rata Batere", value: `${avg("focus_battery_final")}%`, bg: "#50B8A5", fg: "white" },
              { icon: <BookOpen className="w-5 h-5" />, label: "Rata-rata Nilai Kuis", value: avg("quiz_score"), bg: "#FFB3C1", fg: "#1A2A5E" },
              { icon: <Search className="w-5 h-5" />, label: "Rata-rata Skor Fakta", value: avg("fact_score_final"), bg: "#1A2A5E", fg: "white" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl p-4 flex flex-col gap-1.5" style={{ background: card.bg }}>
                <div style={{ color: card.fg }}>{card.icon}</div>
                <p className="font-display font-extrabold text-2xl" style={{ color: card.fg }}>{card.value}</p>
                <p className="font-body text-xs font-semibold" style={{ color: card.fg, opacity: 0.85 }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: "#D1F0EB" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#D1F0EB" }}>
              <h2 className="font-display font-bold text-lg" style={{ color: "#1A2A5E" }}>
                Tabel Aktivitas Siswa ({sessions.length} Siswa)
              </h2>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <span className="text-4xl">📭</span>
                <p className="font-display font-bold text-base text-slate-800">Belum Ada Siswa Selesai</p>
                <p className="font-body text-xs text-slate-500">Minta siswa memasukkan kode kelas <span className="font-mono font-bold text-teal-600">{code}</span> di awal permainan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ background: "#F0FAF8" }}>
                      {["Nama Siswa", "Mode", "Skor Fakta", "Total Skor", "Nilai Kuis", "Benar", "Salah", "🔋 Batere", "Waktu Selesai"].map((h) => (
                        <th key={h} className="px-4 py-3.5 font-display font-bold text-xs whitespace-nowrap" style={{ color: "#1A2A5E" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => {
                      return (
                        <tr key={s.id} className="border-t transition hover:bg-teal-50/40" style={{ borderColor: "#F0FAF8", background: i % 2 === 0 ? "white" : "#FAFFFE" }}>
                          <td className="px-4 py-3.5 font-body font-bold whitespace-nowrap" style={{ color: "#1A2A5E" }}>{s.student_name}</td>
                          <td className="px-4 py-3.5 font-body text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${s.game_mode === "HARD" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {s.game_mode}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-display font-bold text-base text-slate-600">{s.fact_score_final}</td>
                          <td className="px-4 py-3.5 font-display font-extrabold text-base" style={{ color: "#50B8A5" }}>{s.total_score}</td>
                          <td className="px-4 py-3.5 font-display font-bold text-slate-700">
                            {s.quiz_score}
                          </td>
                          <td className="px-4 py-3.5 font-body text-emerald-600 font-bold">{s.total_correct_actions}</td>
                          <td className="px-4 py-3.5 font-body text-rose-500 font-bold">{s.total_incorrect_actions}</td>
                          <td className="px-4 py-3.5 font-body font-semibold " style={{ color: "#1A2A5E" }}>{s.focus_battery_final}%</td>
                          <td className="px-4 py-3.5 font-body text-[11px] whitespace-nowrap text-slate-400">
                            {new Date(s.completed_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE LEADERBOARD                                                   */}
      {/* ========================================================================= */}
      {activeTab === "live" && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 flex flex-col gap-6 shadow-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-xl text-white">Papan Peringkat Kelas (Live)</h2>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Peringkat real-time batere fokus & skor fakta siswa.
              </p>
            </div>

            <button
              onClick={() => router.push(`/teacher/classes/${code}/live`)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition text-sm font-semibold text-teal-400"
            >
              <Maximize2 className="w-4 h-4" /> Full Screen
            </button>
          </div>

          {sortedLeaderboard.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              Belum ada data siswa yang masuk.
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="px-4 py-3 font-display font-bold">Peringkat</th>
                    <th className="px-4 py-3 font-display font-bold">Nama Siswa</th>
                    <th className="px-4 py-3 font-display font-bold text-right">Skor Fakta</th>
                    <th className="px-4 py-3 font-display font-bold text-right">Skor Kuis</th>
                    <th className="px-4 py-3 font-display font-bold text-right">Total Skor</th>
                    <th className="px-4 py-3 font-display font-bold text-right">Batere Fokus</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((session, index) => {
                    const rank = index + 1;
                    const rankBadge = rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : `#${rank}`;
                    const bat = session.focus_battery_final;
                    const batColor = bat > 60 ? "text-emerald-400" : bat > 30 ? "text-amber-400" : "text-rose-400";

                    return (
                      <tr key={session.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition">
                        <td className="px-4 py-3.5 font-display font-bold text-white w-24">{rankBadge}</td>
                        <td className="px-4 py-3.5 font-body font-bold text-white">
                          {session.student_name}
                          {session.game_mode === "HARD" && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🔥
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-display font-extrabold text-teal-300 text-right">{session.fact_score_final}</td>
                        <td className="px-4 py-3.5 font-display font-extrabold text-indigo-300 text-right">{session.quiz_score}</td>
                        <td className="px-4 py-3.5 font-display font-extrabold text-amber-300 text-right">{session.total_score}</td>
                        <td className={`px-4 py-3.5 font-body font-bold ${batColor} text-right`}>{bat}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DASBOR ANALISIS AKHIR KELAS & REKOMENDASI GURU                     */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="flex flex-col gap-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border flex flex-col gap-1 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Siswa Selesai</span>
              <span className="font-display font-extrabold text-3xl text-[#1A2A5E]">{sessions.length}</span>
              <span className="text-xs text-teal-600 font-medium">siswa terdaftar di leaderboard</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border flex flex-col gap-1 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Akurasi Deteksi</span>
              <span className="font-display font-extrabold text-3xl text-emerald-600">{accuracy}%</span>
              <span className="text-xs text-slate-400 font-medium">Bisa membedakan fakta vs hoaks</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border flex flex-col gap-1 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Rata-rata Skor Fakta</span>
              <span className="font-display font-extrabold text-3xl text-amber-500">{avg("fact_score_final")}</span>
              <span className="text-xs text-slate-400 font-medium">Dari simulasi detektif</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border flex flex-col gap-1 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Rata-rata

              </span>
              <span className="font-display font-extrabold text-3xl text-indigo-600">{avg("quiz_score")}</span>
              <span className="text-xs text-slate-400 font-medium">Dari kuis teori dasar</span>
            </div>
          </div>

          {/* Peta Literasi Digital */}
          {/* Peta Literasi Digital & Diagnosis Kesalahan Siswa (Merged Box) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Peta Literasi Digital Kelas
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Distribusi kecenderungan siswa saat menilai konten. Apakah mereka kritis, mudah tertipu, atau terlalu curiga?</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={literacyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {literacyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any, name: any) => [`${value} interaksi`, name]}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-slate-900" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Fokus Perbaikan
                </h2>
              </div>
              
              <p className="text-xs text-slate-500 mb-2">Area ini menunjukkan kesalahan umum yang paling sering dilakukan siswa selama simulasi.</p>

              <div className="flex flex-col gap-3 flex-1 justify-center">
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🎣</span>
                  <div>
                    <p className="font-display font-bold text-sm text-rose-700">Mudah Terkecoh (Gullible)</p>
                    <p className="font-body text-xs text-slate-600 mt-1">
                      Terdapat <strong className="text-rose-600">{classFN} interaksi</strong> dimana siswa menyukai atau membagikan konten hoaks/AI karena mengira itu fakta riil.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🛡️</span>
                  <div>
                    <p className="font-display font-bold text-sm text-amber-700">Terlalu Curiga (Paranoid)</p>
                    <p className="font-body text-xs text-slate-600 mt-1">
                      Terdapat <strong className="text-amber-600">{classFP} interaksi</strong> dimana siswa melaporkan konten asli sebagai hoaks. Siswa takut salah sehingga curiga pada semua hal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistik Interaksi & Battery Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Statistik Interaksi Table */}
            <div className="bg-white rounded-3xl p-6 border flex flex-col gap-4 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-display font-black text-2xl text-[#1A2A5E]">Statistik Interaksi 📱</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-body">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2"></th>
                      <th className="py-2 text-center text-emerald-600 font-bold">Benar</th>
                      <th className="py-2 text-center text-rose-600 font-bold">Salah</th>
                      <th className="py-2 text-center text-slate-500 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-3 text-slate-600">Video Disukai</td>
                      <td className="py-3 text-center font-bold text-emerald-600">{statLikes.correct}</td>
                      <td className="py-3 text-center font-bold text-rose-600">{statLikes.incorrect}</td>
                      <td className="py-3 text-center font-bold text-slate-900">{statLikes.total}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-600">Video Dibagikan</td>
                      <td className="py-3 text-center font-bold text-emerald-600">{statShares.correct}</td>
                      <td className="py-3 text-center font-bold text-rose-600">{statShares.incorrect}</td>
                      <td className="py-3 text-center font-bold text-slate-900">{statShares.total}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-600">Laporkan Hoaks</td>
                      <td className="py-3 text-center font-bold text-emerald-600">{statHoax.correct}</td>
                      <td className="py-3 text-center font-bold text-rose-600">{statHoax.incorrect}</td>
                      <td className="py-3 text-center font-bold text-slate-900">{statHoax.total}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-600">Laporkan AI Palsu</td>
                      <td className="py-3 text-center font-bold text-emerald-600">{statAI.correct}</td>
                      <td className="py-3 text-center font-bold text-rose-600">{statAI.incorrect}</td>
                      <td className="py-3 text-center font-bold text-slate-900">{statAI.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Battery Matrix */}
            <div className="bg-white rounded-3xl p-6 border flex flex-col gap-4 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-lime-500" />
                <h2 className="font-display font-bold text-lg text-slate-900">Matriks Energi Baterai Fokus</h2>
              </div>

              <div className="space-y-3 mt-1 flex-1 justify-center flex flex-col">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">Fokus Tinggi (≥ 60%)</span>
                    <span className="text-emerald-700 font-bold">{highBatteryCount} siswa</span>
                  </div>
                  <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(highBatteryCount / (sessions.length || 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700">Fokus Sedang (30% - 59%)</span>
                    <span className="text-amber-700 font-bold">{medBatteryCount} siswa</span>
                  </div>
                  <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(medBatteryCount / (sessions.length || 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700">Fokus Kritis (&lt; 30%)</span>
                    <span className="text-rose-700 font-bold">{lowBatteryCount} siswa</span>
                  </div>
                  <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(lowBatteryCount / (sessions.length || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video watch duration (Full Width) */}
          <div className="bg-white rounded-3xl p-6 border flex flex-col gap-4 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="font-display font-bold text-lg text-slate-900">Analisis Durasi Tontonan Video</h2>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-display font-semibold text-xs text-slate-500 uppercase">🔥 Top 4 Paling Lama Ditonton</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1">
                {top4LongestVideos.map((v, i) => (
                  <div key={v.video_id} className={`p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-teal-700 line-clamp-1">#{i + 1} @{v.author_username || v.video_id}</span>
                      <span className="font-display font-bold text-sm text-slate-900 shrink-0">{v.avg_secs}s</span>
                    </div>

                    <div className="w-full aspect-[9/16] rounded-md overflow-hidden bg-black relative shadow-sm">
                      {v.video_url && (
                        <video
                          src={v.video_url}
                          className="w-full h-full object-contain"
                          preload="metadata"
                          controls
                          playsInline
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 inline-block">{v.category || "Video"}</span>
                      <p className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed">
                        "{v.caption}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analisis Hasil Kuis */}
          {quizStats.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border flex flex-col gap-4 shadow-sm" style={{ borderColor: "#D1F0EB" }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <h2 className="font-display font-bold text-lg text-slate-900">Analisis Hasil Kuis</h2>
              </div>
              <p className="text-sm text-slate-500 mb-2">Seluruh pertanyaan kuis diurutkan berdasarkan jumlah kesalahan terbanyak. Terdapat informasi jawaban benar dan pola kesalahan siswa.</p>

              <div className="flex flex-col gap-4">
                {quizStats.map((q, idx) => {
                  const totalMistakesForQ = q.incorrect_count;
                  const totalAnswersForQ = totalMistakesForQ + q.correct_count;
                  const correctPercentage = totalAnswersForQ > 0 ? Math.round((q.correct_count / totalAnswersForQ) * 100) : 0;

                  return (
                    <div key={q.question_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`flex items-center justify-center font-bold w-6 h-6 rounded-full text-xs shrink-0 ${totalMistakesForQ > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-display font-bold text-sm text-slate-900 leading-snug">{q.question_text}</p>
                          {totalMistakesForQ > 0 ? (
                            <p className="text-xs text-rose-600 font-semibold mt-1">{totalMistakesForQ} siswa salah menjawab</p>
                          ) : (
                            <p className="text-xs text-emerald-600 font-semibold mt-1">Semua siswa menjawab benar! 🎉</p>
                          )}
                        </div>
                      </div>

                      <div className="pl-9 flex flex-col gap-2 mt-1">
                        {/* Show Correct Answer */}
                        <div className="flex flex-col gap-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Jawaban Benar</span>
                            {totalAnswersForQ > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700">{correctPercentage}% ({q.correct_count})</span>
                            )}
                          </div>
                          <span className="text-[12px] font-semibold text-emerald-900">"{q.options[q.correct_index]}"</span>
                        </div>

                        {/* Show Mistakes if any */}
                        {totalMistakesForQ > 0 && Object.entries(q.selected_distribution).map(([optIdxStr, count]) => {
                          const optIdx = parseInt(optIdxStr);
                          const percentage = Math.round((count / totalAnswersForQ) * 100);
                          return (
                            <div key={optIdx} className="flex flex-col gap-1 mt-1">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span className="line-clamp-1 flex-1 pr-2">Jawab: "{q.options[optIdx] || "Opsi tidak diketahui"}"</span>
                                <span>{percentage}% ({count})</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auto Pedagogy Insight */}
          <div className="bg-gradient-to-r from-teal-900 to-indigo-950 rounded-3xl p-6 text-white flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-400" />
              <h2 className="font-display font-bold text-xl text-white">
                Rekomendasi Pembelajaran untuk Guru (Auto Insight)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                <p className="font-display font-bold text-sm text-teal-300 mb-1">1. Pola Keamanan</p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {totalIncorrect > totalCorrect
                    ? "Terdapat kerentanan hoaks: Siswa cukup sering melewatkan konten palsu tanpa melaporkannya. Disarankan memberikan latihan mengenali bukti fisik/AI."
                    : "Siswa sudah cukup teliti, namun terkadang terlalu mencurigai konten fakta asli. Perjelas perbedaan antara rumor dan berita resmi."}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                <p className="font-display font-bold text-sm text-purple-300 mb-1">2. Ketahanan Fokus</p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {avg("focus_battery_final") >= 50
                    ? `Sebagian besar siswa mampu menjaga konsentrasi hingga akhir permainan dengan sisa energi fokus rata-rata ${avg("focus_battery_final")}%.`
                    : "Siswa banyak kehilangan energi fokus di pertengahan video. Berikan jeda atau ingatkan fitur CEK sebelum bertindak."}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                <p className="font-display font-bold text-sm text-amber-300 mb-1">3. Bahan Diskusi Kelas</p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {top4LongestVideos.length > 0
                    ? `Video "${top4LongestVideos[0]?.author_username || top4LongestVideos[0]?.video_id}" paling banyak menyita perhatian (${top4LongestVideos[0]?.avg_secs}s). Cocok dijadikan bahan diskusi bersama.`
                    : "Data tontonan sedang dikumpulkan."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
