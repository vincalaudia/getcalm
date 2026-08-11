"use client";

/**
 * components/play/VideoPlayer.tsx
 *
 * One feed item. Responsibilities:
 *  1. Video playback (direct MP4 or YouTube iframe)
 *  2. Seekable progress bar at the bottom (MP4 only)
 *  3. Single-tap  → toggle play / pause
 *  4. Double-tap  → LIKE (TikTok gesture, heart burst)
 *  5. Buffering spinner for slow connections
 *  6. Expandable caption ("Selengkapnya" / "Tutup")
 *  7. Gameplay timer wiring via Framer Motion viewport detection
 *
 * Performance notes (for 16 × ~1 min videos):
 *   • preload="none" — browser loads nothing until the video enters the
 *     viewport and play() is called.
 *   • Only metadata (duration) is fetched via onLoadedMetadata.
 *   • The progress-bar timeupdate listener is passive.
 */
import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RefObject } from "react";
import type { VideoRow } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";
import InteractionSidebar from "./InteractionSidebar";
import { Volume2, VolumeX } from "lucide-react";

/* ─────────────────────────────────────────────────────── */
/*  Constants                                              */
/* ─────────────────────────────────────────────────────── */

const CATEGORY_SCENE: Record<VideoRow["category"], { emoji: string; gradient: string }> = {
  "Real News": { emoji: "📰", gradient: "from-[#0B0E24] via-[#131A3A] to-[#0B0E24]" },
  "Entertainment Non AI": { emoji: "🐾", gradient: "from-[#1A1030] via-[#241645] to-[#0B0E24]" },
  "Entertainment AI": { emoji: "🐉", gradient: "from-[#1A0E33] via-[#2A1450] to-[#0B0E24]" },
  "AI Hoax": { emoji: "🤖", gradient: "from-[#2A0E1E] via-[#33132B] to-[#0B0E24]" },
  Hoax: { emoji: "🎁", gradient: "from-[#241505] via-[#2E1B08] to-[#0B0E24]" },
};

/* ─────────────────────────────────────────────────────── */
/*  YouTube helper                                         */
/* ─────────────────────────────────────────────────────── */

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch { /* invalid URL */ }
  return null;
}

/* ─────────────────────────────────────────────────────── */
/*  Types                                                  */
/* ─────────────────────────────────────────────────────── */

interface HeartBurst { id: number; x: number; y: number; }
let heartIdCounter = 0;

interface VideoPlayerProps {
  video: VideoRow;
  containerRef: RefObject<HTMLDivElement>;
  onOpenCek: (video: VideoRow) => void;
  onOpenLaporkan: (video: VideoRow) => void;
  onOpenBagikan: (video: VideoRow) => void;
}

/* ─────────────────────────────────────────────────────── */
/*  Component                                              */
/* ─────────────────────────────────────────────────────── */

export default function VideoPlayer({
  video,
  containerRef,
  onOpenCek,
  onOpenLaporkan,
  onOpenBagikan,
}: VideoPlayerProps) {

  /* UI state */
  const [videoFailed, setVideoFailed] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [progress, setProgress] = useState(0);   // 0..1
  const [duration, setDuration] = useState(0);   // seconds
  const [thumbVisible, setThumbVisible] = useState(false); // grows on press
  const [isMuted, setIsMuted] = useState(false); // start unmuted

  /* Refs */
  const videoElRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const isDragging = useRef(false);
  const pauseIconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Store */
  const setCurrentVideoId = useGameStore((s) => s.setCurrentVideoId);
  const startVideoTimer = useGameStore((s) => s.startVideoTimer);
  const stopVideoTimer = useGameStore((s) => s.stopVideoTimer);
  const handleInteraction = useGameStore((s) => s.handleInteraction);
  const videoState = useGameStore((s) => s.videoStates[video.id]);
  const likedAt = videoState?.likedAt ?? false;

  const scene = CATEGORY_SCENE[video?.category as keyof typeof CATEGORY_SCENE] || { 
    emoji: "📹", 
    gradient: "from-[#0B0E24] via-[#131A3A] to-[#0B0E24]" 
  };
  const youtubeId = getYouTubeId(video.video_url);
  const ytEmbedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${youtubeId}&controls=0&playsinline=1&rel=0&modestbranding=1`
    : null;

  /* ── Viewport / timer wiring ──────────────────────────── */
  const handleEnter = () => {
    setCurrentVideoId(video.id);
    startVideoTimer(video.id, video.category, video.durasi_total);
    const el = videoElRef.current;
    if (el) {
      el.play().catch(() => { });
      setIsPaused(false);
    }
  };

  const handleLeave = () => {
    stopVideoTimer(video.id);
    videoElRef.current?.pause();
  };

  /* ── Video element event handlers ─────────────────────── */
  const onTimeUpdate = () => {
    const el = videoElRef.current;
    if (!el || isDragging.current) return;
    if (el.duration > 0) setProgress(el.currentTime / el.duration);
  };

  const onLoadedMetadata = () => {
    const el = videoElRef.current;
    if (el) setDuration(el.duration);
  };

  /* ── Progress bar drag ─────────────────────────────────── */
  const seekTo = (clientX: number) => {
    const bar = progressBarRef.current;
    const el = videoElRef.current;
    if (!bar || !el || !el.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  };

  const onBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    setThumbVisible(true);
    seekTo(e.clientX);
  };
  const onBarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    seekTo(e.clientX);
  };
  const onBarPointerUp = () => {
    isDragging.current = false;
    setThumbVisible(false);
  };

  /* ── Tap handling: single = play/pause, double = LIKE ─── */
  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("aside") || target.closest("button")) return;

      tapCountRef.current += 1;

      if (tapCountRef.current === 1) {
        tapTimerRef.current = setTimeout(() => {
          tapCountRef.current = 0;
          // ── Single tap → toggle play / pause ──
          const el = videoElRef.current;
          if (!el || ytEmbedUrl) return; // can't control YouTube iframes
          if (el.paused) {
            el.play().catch(() => { });
            setIsPaused(false);
          } else {
            el.pause();
            setIsPaused(true);
          }
          // Briefly show a play/pause icon
          setShowPauseIcon(true);
          if (pauseIconTimer.current) clearTimeout(pauseIconTimer.current);
          pauseIconTimer.current = setTimeout(() => setShowPauseIcon(false), 700);
        }, 280);

      } else if (tapCountRef.current >= 2) {
        // ── Double tap → LIKE ──
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapCountRef.current = 0;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = ++heartIdCounter;
        setHearts((prev) => [...prev, { id, x, y }]);
        setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 900);

        if (!likedAt) handleInteraction(video.id, video.category, "LIKE");
      }
    },
    [likedAt, handleInteraction, video.id, video.category, ytEmbedUrl]
  );

  /* ── Caption ──────────────────────────────────────────── */
  const CAPTION_THRESHOLD = 80;
  const isLong = video.caption.length > CAPTION_THRESHOLD;
  const displayCaption = !captionExpanded && isLong
    ? video.caption.slice(0, CAPTION_THRESHOLD).trimEnd() + "…"
    : video.caption;

  /* ── Render ───────────────────────────────────────────── */
  return (
    <motion.div
      className="feed-item cursor-pointer select-none"
      onViewportEnter={handleEnter}
      onViewportLeave={handleLeave}
      viewport={{ root: containerRef, amount: 0.65 }}
      onClick={handleTap}
    >
      {/* ── Video layer ── */}
      <div className={`absolute inset-0 bg-gradient-to-b ${scene.gradient}`}>
        {ytEmbedUrl ? (
          <iframe
            src={ytEmbedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            title={video.caption.slice(0, 60)}
          />
        ) : !videoFailed ? (
          <video
            ref={videoElRef}
            src={video.video_url}
            muted={isMuted}
            loop
            playsInline
            preload="none"          /* Don't load until play() is called */
            className="w-full h-full object-cover"
            onError={() => setVideoFailed(true)}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
          />
        ) : (
          /* Illustrated fallback */
          <div className="w-full h-full flex items-center justify-center">
            <motion.span
              className="text-8xl drop-shadow-[0_0_30px_rgba(139,61,255,0.45)]"
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              {scene.emoji}
            </motion.span>
          </div>
        )}

        {/* Starfield overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(1px_1px_at_20%_30%,white,transparent),radial-gradient(1px_1px_at_70%_60%,white,transparent),radial-gradient(1.5px_1.5px_at_40%_80%,white,transparent),radial-gradient(1px_1px_at_85%_20%,white,transparent)]" />
      </div>

      {/* ── Bottom scrim ── */}
      <div 
        className={`absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-300 bg-gradient-to-t ${
          captionExpanded
            ? "h-[85%] from-black/95 via-black/70 to-transparent"
            : "h-64 from-Brand-Deep/90 to-transparent"
        }`} 
      />

      {/* ── Buffering spinner ── */}
      <AnimatePresence>
        {isBuffering && !ytEmbedUrl && !videoFailed && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-11 h-11 rounded-full border-[3px] border-white/25 border-t-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Play / Pause flash icon & Mute button ── */}
      <AnimatePresence>
        {(showPauseIcon || isPaused) && !ytEmbedUrl && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none gap-6"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.18 }}
          >
            {/* Mute button - only shown when paused */}
            {isPaused && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((prev) => !prev);
                }}
                className="pointer-events-auto p-4 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition active:scale-95 shadow-lg"
              >
                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
              </button>
            )}

            <button 
              className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const el = videoElRef.current;
                if (!el) return;
                if (isPaused) {
                  el.play().catch(() => {});
                  setIsPaused(false);
                  setShowPauseIcon(true);
                  if (pauseIconTimer.current) clearTimeout(pauseIconTimer.current);
                  pauseIconTimer.current = setTimeout(() => setShowPauseIcon(false), 700);
                } else {
                  el.pause();
                  setIsPaused(true);
                }
              }}
            >
              {isPaused ? (
                /* Play icon */
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white ml-1" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                /* Pause icon */
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" aria-hidden>
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Seekable progress bar — always at very bottom (TikTok/Reels/Shorts style) ── */}
      {!ytEmbedUrl && !videoFailed && (
        <div
          className="absolute inset-x-0 bottom-0 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 32px tall touch target; visual track is 2px inside it */}
          <div
            ref={progressBarRef}
            className="relative h-8 flex items-center cursor-pointer"
            onPointerDown={onBarPointerDown}
            onPointerMove={onBarPointerMove}
            onPointerUp={onBarPointerUp}
            onPointerCancel={onBarPointerUp}
          >
            {/* Track */}
            <div className="relative w-full h-[2px] bg-white/35 rounded-full">
              {/* Loading shimmer when no metadata yet */}
              {duration === 0 && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/25"
                  animate={{ opacity: [0.25, 0.6, 0.25] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
              {/* Played fill */}
              {duration > 0 && (
                <div
                  className="absolute left-0 top-0 h-full bg-white rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              )}
              {/* Thumb — invisible at rest, springs to life on press */}
              {duration > 0 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white"
                  style={{ left: `calc(${progress * 100}% - 8px)` }}
                  animate={thumbVisible
                    ? { width: 16, height: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.55)" }
                    : { width: 0, height: 0, boxShadow: "0 0px 0px rgba(0,0,0,0)" }
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Author + caption ── */}
      <div
        className="absolute left-4 right-20 z-10"
        style={{ bottom: "32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display font-bold text-Text-Primary text-sm">{video.author_username}</p>
        <p className="font-body text-Text-Secondary text-sm mt-1 leading-snug">
          {displayCaption}
          {isLong && (
            <button
              onClick={() => setCaptionExpanded((v) => !v)}
              className="ml-1 font-semibold text-Text-Primary/80 underline-offset-2 hover:underline active:opacity-70 whitespace-nowrap"
            >
              {captionExpanded ? " Tutup" : " Selengkapnya"}
            </button>
          )}
        </p>
      </div>

      {/* ── Heart bursts on double-tap ── */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            className="absolute pointer-events-none z-20 text-4xl"
            style={{ left: h.x - 24, top: h.y - 24 }}
            initial={{ opacity: 1, scale: 0.4, y: 0 }}
            animate={{ opacity: 0, scale: 1.6, y: -80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>

      <InteractionSidebar
        video={video}
        onOpenCek={onOpenCek}
        onOpenLaporkan={onOpenLaporkan}
        onOpenBagikan={onOpenBagikan}
      />
    </motion.div>
  );
}
