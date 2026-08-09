"use client";

/**
 * components/play/RevealOverlay.tsx
 *
 * Section 5 full-screen reveal: Surface-Glass blurred backdrop, fade-in,
 * pauses the underlying feed (by simply capturing all pointer events),
 * shows the video's supportive reveal_message, and a single chunky
 * "Lanjut Scroll" button that resumes the feed.
 *
 * `video` is looked up by the page from `reveal.videoId` — this component
 * stays presentational and doesn't know about the video list itself.
 */
import { AnimatePresence, motion } from "framer-motion";
import type { VideoRow } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";

interface RevealOverlayProps {
  video: VideoRow | null;
}

const TONE_COPY = {
  correct: {
    title: "Wuihh, Keren Banget! 🎉",
    sub: "Mata elangmu tajam sekali! Kamu berhasil menebak dengan benar.",
  },
  error: {
    title: "Oopsie! Tunggu sebentar... 🙈",
    sub: "Yuk, kita lihat fakta sebenarnya!",
  },
} as const;

export default function RevealOverlay({ video }: RevealOverlayProps) {
  const reveal = useGameStore((s) => s.reveal);
  const closeReveal = useGameStore((s) => s.closeReveal);

  const isOpen = reveal.isOpen && !!video;
  const copy = TONE_COPY[reveal.tone];

  return (
    <AnimatePresence>
      {isOpen && video && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center bg-Surface-Glass backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="flex flex-col items-center gap-4 max-w-xs"
          >
            <h2 className="font-display text-2xl font-extrabold text-Text-Primary">{copy.title}</h2>
            <p className="font-body text-Text-Secondary text-sm">{copy.sub}</p>

            <div className="mt-1 rounded-2xl bg-Surface-Card px-5 py-4">
              <p className="font-body text-Text-Primary text-sm leading-relaxed">{video.reveal_message}</p>
            </div>

            <button onClick={closeReveal} className="btn-chunky mt-3">
              Lanjut Scroll
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
