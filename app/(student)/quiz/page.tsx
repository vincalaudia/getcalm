"use client";

/**
 * app/quiz/page.tsx — Post-session quiz (/quiz)
 *
 * Renders a 5-question AI literacy / hoax detection quiz.
 * Each correct answer awards +10 to currentFactScore via the store.
 * Ends with a final score screen and a "Mulai Lagi" restart button.
 *
 * Questions are self-contained here — no Supabase round-trip needed
 * for the quiz itself (Section 4 footnote: "+10 pts per correct answer").
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Star, RefreshCw, Trophy, FileText, Download, ArrowLeft } from "lucide-react";
import { useGameStore, calculateStats, getWatchedSecondsMap } from "@/hooks/useGameStore";
import { supabase, updateStudentSessionFinal, saveStudentSession, saveStudentVideoViews, saveStudentQuizAnswers, fetchQuizQuestions } from "@/lib/supabaseClient";
import type { VideoRow } from "@/lib/types";
import { useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";

// ---------------------------------------------------------------------------
// Quiz content
// ---------------------------------------------------------------------------
// We use QuizQuestionRow directly from Supabase now.

// ---------------------------------------------------------------------------
type Phase = "quiz" | "result" | "report";

export default function QuizPage() {
  const router = useRouter();
  const currentFactScore = useGameStore((s) => s.currentFactScore);
  const currentFocusBattery = useGameStore((s) => s.currentFocusBattery);
  const addToFactScore = useGameStore((s) => s.currentFactScore); // read-only display
  const handleInteraction = useGameStore((s) => s.handleInteraction);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const resetSession = useGameStore((s) => s.resetSession);

  const viewHistory = useGameStore((s) => s.viewHistory);
  const videoStates = useGameStore((s) => s.videoStates);
  const classCode = useGameStore((s) => s.classCode);
  const studentName = useGameStore((s) => s.studentName);
  const gameMode = useGameStore((s) => s.gameMode);
  const sessionId = useGameStore((s) => s.sessionId);

  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0); // points earned in quiz only
  const [correctCount, setCorrectCount] = useState(0);

  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  useEffect(() => {
    fetchQuizQuestions().then(qs => {
      // Shuffle the order of the questions
      const shuffledQs = [...qs];
      for (let i = shuffledQs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQs[i], shuffledQs[j]] = [shuffledQs[j], shuffledQs[i]];
      }

      // Shuffle the options of each question and update the correct_index
      const processedQs = shuffledQs.map((q) => {
        const correctAnswer = q.options[q.correct_index];
        const shuffledOptions = [...q.options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        return {
          ...q,
          options: shuffledOptions,
          correct_index: newCorrectIndex,
        };
      });

      setQuestions(processedQs);
      setQuestionsLoading(false);
    });
  }, []);

  // Prevent back navigation to stop users from cheating / re-taking questions
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Redirect to home if session data is lost (e.g. reload)
  useEffect(() => {
    if (!studentName) {
      router.replace("/");
    }
  }, [studentName, router]);

  const [answersLog, setAnswersLog] = useState<{ question_id: number; is_correct: boolean; selected_index: number }[]>([]);

  const [reportData, setReportData] = useState<{
    totalCorrectActions: number;
    totalIncorrectActions: number;
    likes: { count: number, correct: number, incorrect: number };
    shares: { count: number, correct: number, incorrect: number };
    hoaxReports: { count: number, correct: number, incorrect: number };
    aiReports: { count: number, correct: number, incorrect: number };
    mostWatchedVideo: VideoRow | null;
    mostWatchedSeconds: number;
    isLoading: boolean;
  }>({
    totalCorrectActions: 0, totalIncorrectActions: 0,
    likes: { count: 0, correct: 0, incorrect: 0 },
    shares: { count: 0, correct: 0, incorrect: 0 },
    hoaxReports: { count: 0, correct: 0, incorrect: 0 },
    aiReports: { count: 0, correct: 0, incorrect: 0 },
    mostWatchedVideo: null, mostWatchedSeconds: 0, isLoading: true
  });
  const reportRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to explanation when an answer is selected
  useEffect(() => {
    if (selectedAnswer !== null && explanationRef.current) {
      setTimeout(() => {
        explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [selectedAnswer]);

  // We use a ref to capture the latest quiz score at the time we enter the
  // report phase, so the async closure doesn't read a stale value.
  const quizScoreRef = useRef(quizScore);
  useEffect(() => { quizScoreRef.current = quizScore; }, [quizScore]);

  // Warn students before leaving the quiz mid-way
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== "result" && phase !== "report") {
        e.preventDefault();
        e.returnValue = "Kuis belum selesai! Progresmu akan hilang jika keluar.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  useEffect(() => {
    if ((phase !== "report" && phase !== "result") || !reportData.isLoading) return;

    const fetchReport = async () => {
      try {
        const videoIds = Array.from(viewHistory);
        let videosData: any[] = [];
        if (videoIds.length > 0) {
          const { data: videos, error } = await supabase
            .from("videos")
            .select("*")
            .in("id", videoIds);
          if (error) throw error;
          videosData = videos || [];
        }

        const stats = calculateStats(videoStates, videosData);

        const watchMap = getWatchedSecondsMap();
        let maxTime = 0;
        let maxVidId: string | null = null;
        videoIds.forEach(id => {
          const time = watchMap.get(id) || 0;
          if (time > maxTime) {
            maxTime = time;
            maxVidId = id;
          }
        });

        const mostWatched = maxVidId ? (videosData ?? []).find(v => v.id === maxVidId) || null : null;

        setReportData({
          totalCorrectActions: stats.total_correct_actions,
          totalIncorrectActions: stats.total_incorrect_actions,
          likes: { count: stats.likes_count, correct: stats.likes_correct, incorrect: stats.likes_incorrect },
          shares: { count: stats.shares_count, correct: stats.shares_correct, incorrect: stats.shares_incorrect },
          hoaxReports: { count: stats.hoax_reports_count, correct: stats.hoax_reports_correct, incorrect: stats.hoax_reports_incorrect },
          aiReports: { count: stats.ai_reports_count, correct: stats.ai_reports_correct, incorrect: stats.ai_reports_incorrect },
          mostWatchedVideo: mostWatched,
          mostWatchedSeconds: maxTime,
          isLoading: false
        });

        // Save final stats to Supabase if student entered a class code
        if (classCode && studentName) {
          // Use latest quizScore from ref to avoid stale closure
          const latestQuizScore = quizScoreRef.current;
          const totalScoreCalc = currentFactScore + latestQuizScore;
          const finalPayload = {
            focus_battery_final: currentFocusBattery,
            fact_score_final: currentFactScore,
            likes_count: stats.likes_count,
            likes_correct: stats.likes_correct,
            likes_incorrect: stats.likes_incorrect,
            shares_count: stats.shares_count,
            shares_correct: stats.shares_correct,
            shares_incorrect: stats.shares_incorrect,
            ai_reports_count: stats.ai_reports_count,
            ai_reports_correct: stats.ai_reports_correct,
            ai_reports_incorrect: stats.ai_reports_incorrect,
            hoax_reports_count: stats.hoax_reports_count,
            hoax_reports_correct: stats.hoax_reports_correct,
            hoax_reports_incorrect: stats.hoax_reports_incorrect,
            total_correct_actions: stats.total_correct_actions,
            total_incorrect_actions: stats.total_incorrect_actions,
            true_positives: stats.true_positives,
            false_positives: stats.false_positives,
            true_negatives: stats.true_negatives,
            false_negatives: stats.false_negatives,
            most_watched_video_id: maxVidId,
            most_watched_seconds: maxTime,
            quiz_score: latestQuizScore,
            quiz_correct_count: correctCount,
            total_score: totalScoreCalc,
          };

          let savedId: string | null = null;

          if (sessionId) {
            // Phase 2: Update the placeholder row created when play started
            const updated = await updateStudentSessionFinal(sessionId, finalPayload);
            savedId = updated?.id ?? null;
          } else {
            // Fallback: student skipped onboarding class code but somehow has classCode
            const inserted = await saveStudentSession({
              student_name: studentName,
              class_code: classCode,
              game_mode: gameMode,
              ...finalPayload,
            });
            savedId = inserted?.id ?? null;
          }

          if (savedId) {
            const videoViews = videoIds
              .map((id) => {
                const state = videoStates[id];
                return {
                  video_id: id,
                  watched_secs: watchMap.get(id) ?? 0,
                  is_liked: !!state?.likedAt,
                  is_shared: !!state?.sharedAt,
                  report_type: state?.reportAction ?? null
                };
              })
              .filter((v) => v.watched_secs > 0 || v.is_liked || v.is_shared || v.report_type);
            // Use sessionId (from play start) if available, otherwise the newly created id
            await saveStudentVideoViews(sessionId ?? savedId, classCode, videoViews);
            await saveStudentQuizAnswers(sessionId ?? savedId, classCode, answersLog);
          }
        }
      } catch (e) {
        console.error(e);
        setReportData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchReport();
    // We intentionally only trigger when phase changes to "report" for the first time.
    // All values from the store (classCode, studentName, etc.) are captured at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Trigger confetti when entering result phase
  useEffect(() => {
    if (phase === "result") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        zIndex: 100,
        colors: ['#A4D037', '#54C0C7', '#FFB3C1', '#FCD34D']
      });
    }
  }, [phase]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#0B0E24" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save("laporan-GetCalmer.pdf");
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  const currentQ = questions[currentQIndex];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentQ?.correct_index;

  const handleAnswer = (idx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedAnswer(idx);
    const correct = idx === currentQ.correct_index;
    if (correct) {
      setQuizScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
    }
    setAnswersLog((prev) => [...prev, { question_id: currentQ.id, is_correct: correct, selected_index: idx }]);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setPhase("result");
    }
  };

  const handleRestart = () => {
    setGameMode("NORMAL");
    resetSession();
    router.push("/");
  };

  const totalScore = currentFactScore + quizScore;
  const rank = totalScore >= 150 ? "🏆 Pahlawan Anti-Hoaks" :
    totalScore >= 80 ? "⭐️ Detektif Fakta" :
      totalScore >= 30 ? "🔍 Penjelajah Kritis" : "🌱 Pemula Literasi";

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden transition-colors duration-500 bg-white">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-Score-Gold fill-Score-Gold" />
          <span className="font-display font-bold text-Score-Gold text-sm tabular-nums">
            {currentFactScore}
          </span>
        </div>
        <h2 className="font-display font-bold text-sm text-[#0A2342]">Waktunya Quiz</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🔋</span>
          <span className="font-body text-xs text-slate-500 font-medium">{currentFocusBattery}%</span>
        </div>
      </div>

      {/* ── QUIZ PHASE ── */}
      {phase === "quiz" && !questionsLoading && questions.length > 0 && (
        <div className="px-5 pt-5 pb-2">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <motion.div
                className="h-full bg-[#54C0C7] rounded-full"
                animate={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            <span className="font-body text-slate-500 text-xs tabular-nums shrink-0 font-bold">
              {currentQIndex + 1}/{questions.length}
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "quiz" && questionsLoading && (
          <motion.div
            key="loading-quiz"
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCw className="w-8 h-8 animate-spin text-Action-Primary" />
          </motion.div>
        )}
        {phase === "quiz" && !questionsLoading && questions.length > 0 && currentQ && (
          <motion.div
            key={`q-${currentQIndex}`}
            className="relative z-10 flex-1 flex flex-col px-5 pt-2 pb-6 overflow-y-auto"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Question */}
            <div className="rounded-3xl bg-white border-2 border-[#54C0C7] p-5 mb-6 text-center shadow-sm">
              <p className="font-display font-bold text-[#67AEB3] text-[11px] uppercase mb-2 tracking-wider">
                Pertanyaan:
              </p>
              <p className="font-display font-bold text-[#0A2342] text-[15px] leading-snug">
                {currentQ.question}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-4 flex-1 pb-4">
              {currentQ.options.map((opt: string, idx: number) => {
                const isSelected = selectedAnswer === idx;
                const correct = idx === currentQ.correct_index;
                const letter = String.fromCharCode(65 + idx); // A, B, C, D

                let bg = "bg-white border-[#67AEB3]";
                let textColor = "text-[#0A2342]";
                let circleBg = "bg-[#E2F3F5]";
                let circleText = "text-[#0A2342]";

                if (isSelected) {
                  bg = "bg-[#D8F5F8] border-[#54C0C7] shadow-[0_4px_12px_rgba(84,192,199,0.2)]";
                  circleBg = "bg-[#27B5C2]";
                  circleText = "text-white";
                }

                if (isAnswered && correct) {
                  bg = "bg-[#E6F8E8] border-[#4ADE80]";
                  circleBg = "bg-[#4ADE80]";
                  circleText = "text-white";
                } else if (isAnswered && isSelected && !correct) {
                  bg = "bg-[#FFF0F2] border-[#F43F5E]";
                  circleBg = "bg-[#F43F5E]";
                  circleText = "text-white";
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={isAnswered}
                    whileTap={{ scale: isAnswered ? 1 : 0.97 }}
                    className={`flex items-center gap-4 rounded-[1.75rem] border-2 px-3 py-3 text-left transition-all duration-200 ${bg} disabled:cursor-default shadow-sm`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs shrink-0 transition-colors ${circleBg} ${circleText}`}>
                      {letter}
                    </div>
                    <span className={`font-body font-semibold text-sm leading-snug ${textColor}`}>{opt}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation + Next */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  ref={explanationRef}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2"
                >
                  <div className={`rounded-2xl px-5 py-4 mb-5 border-2 ${isCorrect ? "bg-[#E6F8E8] border-[#4ADE80]" : "bg-[#FFF0F2] border-[#F43F5E]"}`}>
                    <p className={`font-display font-bold text-sm mb-1 ${isCorrect ? "text-green-700" : "text-rose-700"}`}>
                      {isCorrect ? "✅ Benar! +10 poin" : "❌ Hmm, belum tepat..."}
                    </p>
                    <p className="font-body text-slate-700 text-xs leading-relaxed font-medium">
                      {currentQ.explanation}
                    </p>
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full text-base py-4 rounded-full font-display font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 text-[#0A2342] bg-[#A4D037] border-b-4 border-[#7A9C29]"
                  >
                    {currentQIndex < questions.length - 1 ? "Selanjutnya" : "Lihat Hasil"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === "result" && (
          <motion.div
            key="result"
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center gap-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
          >

            <div>
              <p className="font-body text-slate-500 text-xs mb-1">Gelarmu hari ini</p>
              <h2 className="font-display text-2xl font-extrabold text-[#1A2A5E]">{rank}</h2>
            </div>

            {/* Score breakdown */}
            <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col gap-3">
              <ScoreRow label="Skor Simulasi" value={currentFactScore} color="text-rose-500" />
              <ScoreRow label={`Kuis (${correctCount} benar dari ${questions.length})`} value={quizScore} color="text-emerald-500" />
              <div className="h-px bg-slate-200" />
              <ScoreRow label="Total Skor Fakta" value={totalScore} color="text-amber-500" large />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button onClick={() => setPhase("report")} className="btn-chunky w-full flex items-center justify-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                Lihat Laporan Evaluasi
              </button>
              <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-semibold text-sm transition-all duration-200 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm">
                <RefreshCw className="w-4 h-4" />
                Mulai Lagi
              </button>
            </div>
            {/* Celebrating mascots */}
            <div className="w-full flex justify-center pointer-events-none">
              <Image src="/assets/mascot_celebrate.png" alt="Tito dan Tita merayakan" width={860} height={500} className="object-contain" />
            </div>
          </motion.div>
        )}

        {/* ── REPORT PHASE ── */}
        {phase === "report" && (
          <motion.div
            key="report"
            className="relative z-10 flex-1 flex flex-col px-5 pt-6 pb-8 overflow-y-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {reportData.isLoading ? (
              <div className="m-auto text-slate-500 font-body animate-pulse">Memuat laporan evaluasi...</div>
            ) : (
              <div className="flex flex-col w-full">
                <button
                  onClick={() => setPhase("result")}
                  className="self-start flex items-center gap-2 mb-4 text-slate-500 hover:text-[#1A2A5E] font-body text-sm font-semibold transition bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>

                {/* Printable container */}
                <div ref={reportRef} className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col gap-5 text-left mb-6 shadow-md">
                  <div className="text-center">
                    <h2 className="font-display text-xl font-bold text-[#1A2A5E] mb-1">Laporan Detektif Fakta</h2>
                    <p className="font-body text-xs text-slate-600 mb-1">
                      Siswa: <span className="font-semibold text-slate-800">{studentName}</span>
                      {classCode && <span> | Kelas: <span className="font-semibold text-slate-800">{classCode}</span></span>}
                    </p>
                    <p className="font-body text-[10px] text-slate-400">Evaluasi performa selama sesi simulasi</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="font-display font-bold text-sm text-slate-800 mb-3">Ketepatan Interaksi (Video) 🎯</p>
                    <div className="flex justify-between items-center text-xs text-slate-600 py-1">
                      <span>Interaksi Tepat (Benar)</span>
                      <span className="text-emerald-600 font-bold text-sm">{reportData.totalCorrectActions}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 py-1">
                      <span>Terkecoh (Salah)</span>
                      <span className="text-rose-600 font-bold text-sm">{reportData.totalIncorrectActions}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="font-display font-extrabold text-xl text-[#1A2A5E] mb-3">Statistik Interaksi 📱</p>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="pb-2"></th>
                          <th className="pb-2 text-center font-semibold text-sm text-emerald-600">Benar</th>
                          <th className="pb-2 text-center font-semibold text-sm text-rose-600">Salah</th>
                          <th className="pb-2 text-center font-semibold text-sm text-slate-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-[15px] text-slate-600">
                        <tr className="border-b border-slate-100">
                          <td className="py-3">Video Disukai</td>
                          <td className="py-3 text-center font-semibold text-emerald-600">{reportData.likes.correct}</td>
                          <td className="py-3 text-center font-semibold text-rose-600">{reportData.likes.incorrect}</td>
                          <td className="py-3 text-center font-semibold text-slate-800">{reportData.likes.count}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-3">Video Dibagikan</td>
                          <td className="py-3 text-center font-semibold text-emerald-600">{reportData.shares.correct}</td>
                          <td className="py-3 text-center font-semibold text-rose-600">{reportData.shares.incorrect}</td>
                          <td className="py-3 text-center font-semibold text-slate-800">{reportData.shares.count}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-3">Laporkan Hoaks</td>
                          <td className="py-3 text-center font-semibold text-emerald-600">{reportData.hoaxReports.correct}</td>
                          <td className="py-3 text-center font-semibold text-rose-600">{reportData.hoaxReports.incorrect}</td>
                          <td className="py-3 text-center font-semibold text-slate-800">{reportData.hoaxReports.count}</td>
                        </tr>
                        <tr>
                          <td className="pt-3">Laporkan AI Palsu</td>
                          <td className="pt-3 text-center font-semibold text-emerald-600">{reportData.aiReports.correct}</td>
                          <td className="pt-3 text-center font-semibold text-rose-600">{reportData.aiReports.incorrect}</td>
                          <td className="pt-3 text-center font-semibold text-slate-800">{reportData.aiReports.count}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="font-display font-extrabold text-lg text-[#1A2A5E] mb-3">Hasil Quiz</p>
                    <div className="flex justify-between items-center text-sm text-slate-600 py-1 border-b border-slate-100 pb-2 mb-1">
                      <span>Jawaban Benar</span>
                      <span className="text-emerald-600 font-bold">{correctCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-slate-600 py-1">
                      <span>Jawaban Salah</span>
                      <span className="text-rose-600 font-bold">{questions.length - correctCount}</span>
                    </div>
                  </div>

                  {reportData.mostWatchedVideo && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="font-display font-bold text-sm text-slate-800 mb-2">Baterai Fokus Terkuras 🔋</p>
                      <p className="font-body text-[11px] text-slate-500 mb-3 leading-relaxed">
                        Kamu menghabiskan <strong>{reportData.mostWatchedSeconds} detik</strong> menganalisis video ini:
                      </p>
                      <div className="flex gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl overflow-hidden">
                        <div className="w-24 aspect-[9/16] shrink-0 rounded-md overflow-hidden bg-black relative shadow-sm">
                          <video
                            src={reportData.mostWatchedVideo?.video_url}
                            className="w-full h-full object-contain"
                            preload="metadata"
                            controls
                            playsInline
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-[12px] font-bold text-slate-800 mb-1">@{reportData.mostWatchedVideo?.author_username}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-3 italic leading-relaxed">
                            "{reportData.mostWatchedVideo?.caption}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full flex flex-col gap-3 shrink-0">
                  <button onClick={handleDownloadPDF} className="btn-chunky w-full flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Unduh Laporan (PDF)
                  </button>
                  <button onClick={handleRestart} className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-semibold text-sm transition-all duration-200 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm mt-2">
                    <RefreshCw className="w-4 h-4" />
                    Akhiri & Mulai Sesi Baru
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ScoreRow({ label, value, color, large }: { label: string; value: number; color: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-body text-slate-600 ${large ? "text-sm font-semibold" : "text-xs"}`}>{label}</span>
      <span className={`font-display font-bold tabular-nums ${color} ${large ? "text-2xl" : "text-base"}`}>
        {value > 0 ? "+" : ""}{value} ⭐️
      </span>
    </div>
  );
}
