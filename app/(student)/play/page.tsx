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
import { useGameStore, calculatePoints, getWatchedSecondsMap } from "@/hooks/useGameStore";
import { supabase, fetchVideoFeed } from "@/lib/supabaseClient";
import type { VideoRow } from "@/lib/types";
import Image from "next/image";
import Hud from "@/components/play/Hud";
import VideoPlayer from "@/components/play/VideoPlayer";
import RevealOverlay from "@/components/play/RevealOverlay";
import CekSheet from "@/components/play/BottomSheets/CekSheet";
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
      router.replace("/");
    }
  }, [studentName, router]);

  // ─── Effect 1: Fetch video feed once on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    fetchVideoFeed()
      .then((rows) => {
        if (!cancelled) {
          setVideos(rows as VideoRow[]);
          setLoadState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => { cancelled = true; };
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
      
      let shares_count = 0, shares_correct = 0, shares_incorrect = 0;
      let ai_reports_count = 0, ai_reports_correct = 0, ai_reports_incorrect = 0;
      let hoax_reports_count = 0, hoax_reports_correct = 0, hoax_reports_incorrect = 0;
      let total_correct_actions = 0, total_incorrect_actions = 0;

      const videoIds = Array.from(viewHistory);
      videoIds.forEach(id => {
        const v = videos.find(vid => vid.id === id);
        if (!v) return;
        const state = videoStates[id];
        if (!state) return;

        if (state.sharedAt) {
          shares_count++;
          const pts = calculatePoints(v.category, "SHARE");
          if (pts > 0) { shares_correct++; total_correct_actions++; }
          if (pts < 0) { shares_incorrect++; total_incorrect_actions++; }
        }
        if (state.reportAction === "REPORT_AI") {
          ai_reports_count++;
          const pts = calculatePoints(v.category, "REPORT_AI");
          if (pts > 0) { ai_reports_correct++; total_correct_actions++; }
          if (pts < 0) { ai_reports_incorrect++; total_incorrect_actions++; }
        }
        if (state.reportAction === "REPORT_HOAX") {
          hoax_reports_count++;
          const pts = calculatePoints(v.category, "REPORT_HOAX");
          if (pts > 0) { hoax_reports_correct++; total_correct_actions++; }
          if (pts < 0) { hoax_reports_incorrect++; total_incorrect_actions++; }
        }
        if (state.likedAt) {
          const pts = calculatePoints(v.category, "LIKE");
          if (pts > 0) total_correct_actions++;
          if (pts < 0) total_incorrect_actions++;
        }
      });

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
          shares_count,
          shares_correct,
          shares_incorrect,
          ai_reports_count,
          ai_reports_correct,
          ai_reports_incorrect,
          hoax_reports_count,
          hoax_reports_correct,
          hoax_reports_incorrect,
          total_correct_actions,
          total_incorrect_actions,
          quiz_correct_count: 0,
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
    if (isSessionEnded) router.replace("/quiz");
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
        <div className="absolute inset-0 z-50 bg-[#0B0E24] flex flex-col items-center justify-center gap-4">
          <Image
            src="/assets/loading_gif.gif"
            alt="Loading..."
            width={120}
            height={120}
            unoptimized
            className="w-24 h-24 object-contain"
          />
          <p className="font-body text-Text-Secondary text-sm">Menyiapkan feed...</p>
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
        </div>
      )}

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
