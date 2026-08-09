"use client";

/**
 * components/play/BottomSheets/BagikanSheet.tsx
 *
 * TikTok-style "share to friend" bottom sheet.
 * Simulates forwarding the video to one contact — "Tito" 🤖.
 * Selecting Tito and pressing "Kirim" triggers the SHARE action in the store.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";
import type { VideoRow } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";
import BottomSheet from "@/components/ui/BottomSheet";

interface BagikanSheetProps {
  video: VideoRow | null;
  isOpen: boolean;
  onClose: () => void;
}

const FRIEND = {
  id: "tito",
  name: "Tito",
  avatar: "🤖",
  desc: "Sobat detektifmu",
};

export default function BagikanSheet({ video, isOpen, onClose }: BagikanSheetProps) {
  const [selected, setSelected] = useState(false);
  const [sent, setSent] = useState(false);
  const handleInteraction = useGameStore((s) => s.handleInteraction);

  const handleSend = () => {
    if (!video || !selected || sent) return;
    setSent(true);
    handleInteraction(video.id, video.category, "SHARE");

    // Brief "terkirim!" feedback then close
    setTimeout(() => {
      setSent(false);
      setSelected(false);
      onClose();
    }, 900);
  };

  const handleClose = () => {
    setSelected(false);
    setSent(false);
    onClose();
  };

  if (!video) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <h3 className="font-display text-lg font-bold text-Text-Primary mb-1">Bagikan ke Teman 📤</h3>
      <p className="font-body text-Text-Secondary text-sm mb-5">
        Pilih teman yang ingin kamu kirimi video ini.
      </p>

      {/* Friend card with radio button */}
      <motion.button
        onClick={() => setSelected((v) => !v)}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200"
        style={{
          background: selected
            ? "rgba(139,61,255,0.18)"
            : "rgba(255,255,255,0.05)",
          border: selected
            ? "1.5px solid rgba(139,61,255,0.55)"
            : "1.5px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Avatar */}
        <span className="w-12 h-12 rounded-full bg-Brand-Deep flex items-center justify-center text-2xl shrink-0">
          {FRIEND.avatar}
        </span>

        {/* Name + desc */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-Text-Primary text-sm">{FRIEND.name}</p>
          <p className="font-body text-Text-Muted text-xs mt-0.5">{FRIEND.desc}</p>
        </div>

        {/* Radio indicator */}
        <div
          className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: selected ? "#8B3DFF" : "rgba(255,255,255,0.25)",
            background: selected ? "#8B3DFF" : "transparent",
          }}
        >
          <AnimatePresence>
            {selected && (
              <motion.div
                key="dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-2 h-2 rounded-full bg-white"
              />
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Kirim button */}
      <motion.button
        onClick={handleSend}
        disabled={!selected || sent}
        whileTap={selected && !sent ? { scale: 0.96 } : {}}
        className={`w-full mt-4 flex items-center justify-center gap-2 rounded-full py-3 font-display font-bold text-sm ${
          selected ? "btn-primary" : "bg-white/5 text-white/30 transition-all duration-200"
        }`}
        style={{
          opacity: sent ? 0.7 : 1,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.span
              key="sent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terkirim!
            </motion.span>
          ) : (
            <motion.span
              key="kirim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Kirim ke {FRIEND.name}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </BottomSheet>
  );
}
