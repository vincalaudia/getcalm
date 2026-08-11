"use client";

/**
 * app/play/page.tsx
 *
 * The live feed. Fetches videos from Supabase, renders the swipeable
 * .feed-scroll of <VideoPlayer/> items, and hosts the single shared
 * instances of the two bottom sheets + the reveal overlay (Sections 3 & 5)
 * so only one of each ever exists in the DOM at a time regardless of how
 * many feed items are mounted.
 *
 * Quizizz/Kahoot-style live updates:
 *  - Session row is INSERTed in Supabase as soon as the page mounts (if classCode set).
 *  - Battery + FactScore are PATCHed every 5 s so the teacher's live dashboard
 *    always shows up-to-date values without the student finishing the quiz first.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, calculateStats, getWatchedSecondsMap } from "@/hooks/useGameStore";
import { supabase, fetchVideoFeed } from "@/lib/supabaseClient";
import { startPreload, subscribeToPreload } from "@/lib/feedPreloader";
import type { VideoRow } from "@/lib/types";
import Image from "next/image";
import Hud from "@/components/play/Hud";
import VideoPlayer from "@/components/play/VideoPlayer";
import RevealOverlay from "@/components/play/RevealOverlay";
import CekSheet from "@/components/play/BottomSheets/CekSheet";
import ConfirmEndModal from "@/components/play/ConfirmEndModal";
import LaporkanSheet from "@/components/play/BottomSheets/LaporkanSheet";
import BagikanSheet from "@/components/play/BottomSheets/BagikanSheet";

type ActiveSheet = { type: "CEK" | "LAPORKAN" | "BAGIKAN"; video: VideoRow } | null;

const LIVE_UPDATE_INTERVAL_MS = 5000; // push live score every 5 seconds

export default function PlayPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [showEndPopup, setShowEndPopup] = useState(false);

  // Read store values — store selectors are stable references
  const isSessionEnded = useGameStore((s) => s.isSessionEnded);
  const revealVideoId = useGameStore((s) => s.reveal.videoId);
  const studentName = useGameStore((s) => s.studentName);
  const classCode = useGameStore((s) => s.classCode);
  const gameMode = useGameStore((s) => s.gameMode);
  // Read live metrics using getState() inside intervals to avoid stale closures
  const store = useGameStore;

  // ─── Effect 0: Redirect to home if session data is lost (e.g. reload) ─────
  useEffect(() => {
    if (!studentName) {
      router.replace("/game");
    }
  }, [studentName, router]);

  // ─── Effect 1: Fetch video feed once on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");

    const unsubscribe = subscribeToPreload((p) => {
      if (!cancelled) setPreloadProgress(p);
    });

    startPreload()
      .then((shuffledVideos) => {
        if (!cancelled) {
          setVideos(shuffledVideos);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => { 
      cancelled = true;
      unsubscribe();
    };
  }, []); // run once

  // ─── Effect 1b: Prevent back navigation to tutorial ──────────────────────
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ─── Effect 2: Periodic live-update (Quizizz/Kahoot style) ───────────────
  // Every 5 s, PATCH the session row with the latest battery + fact score so
  // the teacher's dashboard always reflects the current state in real-time.
  useEffect(() => {
    if (!classCode || videos.length === 0) return; // wait until videos are loaded

    const tick = setInterval(() => {
      const { sessionId, currentFocusBattery, currentFactScore, viewHistory, videoStates } = store.getState();
      if (!sessionId) return; // session not created (e.g. skipped onboarding)
      
      const videoIds = Array.from(viewHistory);
      const filteredVideos = videoIds.map(id => videos.find(v => v.id === id)).filter(Boolean) as any[];
      const stats = calculateStats(videoStates, filteredVideos);

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
      
      supabase
        .from("student_sessions")
        .update({
          focus_battery_final: currentFocusBattery,
          fact_score_final: currentFactScore,
          shares_count: stats.shares_count,
          shares_correct: stats.shares_correct,
          shares_incorrect: stats.shares_incorrect,
          likes_count: stats.likes_count,
          likes_correct: stats.likes_correct,
          likes_incorrect: stats.likes_incorrect,
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
          quiz_correct_count: 0,
          quiz_score: 0,
          total_score: currentFactScore,
          most_watched_video_id: maxVidId,
          most_watched_seconds: maxTime,
        } as never)
        .eq("id", sessionId)
        .then(({ error }) => {
          if (error) console.warn("[ThinkTok] Live update error:", error.message);
        });
    }, LIVE_UPDATE_INTERVAL_MS);

    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode, videos]); // stable — changes when videos load

  // ─── Effect 4: Navigate to quiz when battery hits zero ────────────────────
  useEffect(() => {
    if (isSessionEnded) router.replace("/game/quiz");
  }, [isSessionEnded, router]);

  // ─── Effect 5: Warn student before closing/reloading the tab ─────────────
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!isSessionEnded) {
        e.preventDefault();
        e.returnValue = "Progresmu belum tersimpan! Yakin mau keluar?";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isSessionEnded]);

  const revealVideo = videos.find((v) => v.id === revealVideoId) ?? null;

  return (
    <div className="relative h-full w-full">
      <Hud />

      {loadState === "loading" && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6"
          style={{ background: "linear-gradient(180deg, #f9f5ff 0%, #ffffff 50%, #fdf0f8 100%)" }}
        >
          <div className="flex flex-col items-center z-10 w-full max-w-xs">
            <Image src="/assets/loading_gif.gif" alt="Loading..." width={120} height={120} className="object-contain" unoptimized />
            <h2 className="font-display font-bold text-[#3B3669] mt-6 mb-4 text-lg">Menyiapkan Simulasi...</h2>
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
               <motion.div 
                 className="h-full bg-[#8b7ae2] rounded-full" 
                 animate={{ width: `${preloadProgress}%` }} 
                 transition={{ duration: 0.2 }}
               />
            </div>
            <p className="font-body text-xs text-slate-500 mt-2 font-bold">{preloadProgress}%</p>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <div className="h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-5xl">😵</span>
          <div>
            <p className="font-display font-bold text-Text-Primary text-base">Waduh, gagal dimuat!</p>
            <p className="font-body text-Text-Muted text-xs mt-1 leading-relaxed">
              Pastikan tabel <code className="text-Action-Secondary">videos</code> sudah dibuat di Supabase dan variabel{" "}
              <code className="text-Action-Secondary">NEXT_PUBLIC_SUPABASE_*</code> sudah diisi di{" "}
              <code className="text-Action-Secondary">.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {loadState === "ready" && (
        <div ref={containerRef} className="feed-scroll">
          {videos.map((video) => (
            <VideoPlayer
              key={video.id}
              video={video}
              containerRef={containerRef}
              onOpenCek={(v) => setActiveSheet({ type: "CEK", video: v })}
              onOpenLaporkan={(v) => setActiveSheet({ type: "LAPORKAN", video: v })}
              onOpenBagikan={(v) => setActiveSheet({ type: "BAGIKAN", video: v })}
            />
          ))}
          
          {/* End of feed trigger element */}
          {videos.length > 0 && (
            <motion.div
              className="feed-item flex items-center justify-center bg-black relative"
              onViewportEnter={() => setShowEndPopup(true)}
              viewport={{ root: containerRef, amount: 0.1 }}
            />
          )}
        </div>
      )}

      {/* End of Scroll Popup */}
      <ConfirmEndModal 
        isOpen={showEndPopup} 
        onClose={() => {
          setShowEndPopup(false);
          if (containerRef.current) {
            containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: "smooth" });
          }
        }} 
      />

      <CekSheet
        video={activeSheet?.type === "CEK" ? activeSheet.video : null}
        isOpen={activeSheet?.type === "CEK"}
        onClose={() => setActiveSheet(null)}
      />
      <LaporkanSheet
        video={activeSheet?.type === "LAPORKAN" ? activeSheet.video : null}
        isOpen={activeSheet?.type === "LAPORKAN"}
        onClose={() => setActiveSheet(null)}
      />
      <BagikanSheet
        video={activeSheet?.type === "BAGIKAN" ? activeSheet.video : null}
        isOpen={activeSheet?.type === "BAGIKAN"}
        onClose={() => setActiveSheet(null)}
      />
      <RevealOverlay video={revealVideo} />
    </div>
  );
}
