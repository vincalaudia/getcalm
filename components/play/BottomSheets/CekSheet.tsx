"use client";

/**
 * components/play/BottomSheets/CekSheet.tsx
 *
 * Two-phase investigation modal:
 *
 *  Phase 1 — "Pilih" (Choose):
 *    Two mutually-exclusive option cards:
 *      • Deteksi Jejak AI    → uses video.ai_clue + ai_clue_image_url
 *      • Intip Fakta Aslinya → uses video.real_fact + real_fact_image_url
 *    Tapping one card commits the choice and transitions to Phase 2.
 *
 *  Phase 2 — "Baca" (Read):
 *    Shows the explanation text + optional 3:4 portrait image.
 *    A "Mengerti!" button (or backdrop tap) closes the sheet.
 *
 * On entering Phase 2, handleCekInteraction() is called:
 *  → hasChecked = true
 *  → LAPORKAN unlocked
 *  → CEK button permanently disabled for this video (cekDisabled = hasChecked)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, ChevronLeft, ImageOff } from "lucide-react";
import type { VideoRow } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";
import BottomSheet from "@/components/ui/BottomSheet";

interface CekSheetProps {
  video: VideoRow | null;
  isOpen: boolean;
  onClose: () => void;
}

type CekChoice = "AI" | "FAKTA";
type Phase = "choose" | "explain";

// Config per choice
const CHOICE_CONFIG = {
  AI: {
    label: "Deteksi Jejak AI",
    sublabel: "Cari tanda-tanda buatan AI",
    icon: Bot,
    iconColor: "text-Action-Secondary",
    iconBg: "bg-Action-Secondary/15",
    accentColor: "rgba(47,182,201,0.18)",
    accentBorder: "rgba(47,182,201,0.4)",
    titlePhase2: "Jejak AI Ditemukan! 🤖",
    getContent: (v: VideoRow) => ({ text: v.ai_clue, imageUrl: v.ai_clue_image_url }),
  },
  FAKTA: {
    label: "Intip Fakta Aslinya",
    sublabel: "Lihat kebenaran di balik video ini",
    icon: Sparkles,
    iconColor: "text-Score-Gold",
    iconBg: "bg-Score-Gold/15",
    accentColor: "rgba(255,201,74,0.15)",
    accentBorder: "rgba(255,201,74,0.4)",
    titlePhase2: "Ini Fakta Sebenarnya! 💡",
    getContent: (v: VideoRow) => ({ text: v.real_fact, imageUrl: v.real_fact_image_url }),
  },
} as const;

export default function CekSheet({ video, isOpen, onClose }: CekSheetProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [choice, setChoice] = useState<CekChoice | null>(null);
  const handleCekInteraction = useGameStore((s) => s.handleCekInteraction);

  const handleChoose = (option: CekChoice) => {
    if (!video) return;
    setChoice(option);
    setPhase("explain");
    // Commit: marks hasChecked = true, decrements HARD quota.
    handleCekInteraction(video.id);
  };

  const handleClose = () => {
    // Reset phase so if somehow re-opened (e.g., quota not spent yet) it's fresh.
    setPhase("choose");
    setChoice(null);
    onClose();
  };

  if (!video) return null;

  const cfg = choice ? CHOICE_CONFIG[choice] : null;
  const content = cfg ? cfg.getContent(video) : null;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <AnimatePresence mode="wait" initial={false}>

        {/* ── Phase 1: Choose ── */}
        {phase === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            <h3 className="font-display text-lg font-bold text-Text-Primary mb-1">
              Yuk, Investigasi! 🔍
            </h3>
            <p className="font-body text-Text-Secondary text-sm mb-5">
              Pilih <span className="font-semibold text-Text-Primary">satu</span> cara untuk mengetahui lebih dalam tentang video ini.
            </p>

            <div className="flex flex-col gap-3">
              {(["AI", "FAKTA"] as CekChoice[]).map((opt) => {
                const c = CHOICE_CONFIG[opt];
                const Icon = c.icon;
                return (
                  <motion.button
                    key={opt}
                    onClick={() => handleChoose(opt)}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-4 rounded-2xl p-4 text-left transition-colors"
                    style={{
                      background: c.accentColor,
                      border: `1.5px solid ${c.accentBorder}`,
                    }}
                  >
                    <span className={`w-12 h-12 shrink-0 rounded-full ${c.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${c.iconColor}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-Text-Primary text-sm">{c.label}</p>
                      <p className="font-body text-Text-Muted text-xs mt-0.5">{c.sublabel}</p>
                    </div>
                    <span className="text-Text-Muted text-lg">→</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Phase 2: Explain ── */}
        {phase === "explain" && cfg && content && (
          <motion.div
            key="explain"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {/* Back button (go to choose, but hasChecked already true) */}
            <button
              onClick={() => setPhase("choose")}
              className="flex items-center gap-1 text-Text-Muted font-body text-xs mb-3 -ml-1 active:opacity-70"
            >
              <ChevronLeft className="w-4 h-4" />
              Pilih lagi
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`w-10 h-10 shrink-0 rounded-full ${cfg.iconBg} flex items-center justify-center`}
              >
                <cfg.icon className={`w-5 h-5 ${cfg.iconColor}`} />
              </span>
              <h3 className="font-display text-base font-bold text-Text-Primary leading-snug">
                {cfg.titlePhase2}
              </h3>
            </div>

            {/* 3:4 portrait image — shown only when imageUrl is set */}
            {content.imageUrl ? (
              <div
                className="mx-auto rounded-2xl overflow-hidden mb-4"
                style={{ width: "180px", aspectRatio: "3 / 4" }}
              >
                <img
                  src={content.imageUrl}
                  alt={cfg.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}

            {/* Explanation text */}
            <div
              className="rounded-2xl px-4 py-3 mb-5"
              style={{
                background: cfg.accentColor,
                border: `1px solid ${cfg.accentBorder}`,
              }}
            >
              <p className="font-body text-Text-Primary text-sm leading-relaxed">
                {content.text}
              </p>
            </div>

            <button onClick={handleClose} className="btn-chunky w-full text-base py-3">
              Mengerti! 👍
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
