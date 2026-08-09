"use client";

/**
 * components/play/BottomSheets/LaporkanSheet.tsx
 *
 * Section 3.C "LAPORKAN" bottom sheet.
 * Only two reportable categories (kids only report genuinely dangerous content):
 *   - Berita Bohong (Hoax)
 *   - AI Fake
 * Plus a Batal (Cancel) option.
 *
 * Berita Asli and Hiburan have been intentionally removed — real news and
 * entertainment don't need to be reported.
 */
import { motion } from "framer-motion";
import { Bug, Bot, X } from "lucide-react";
import type { ReportOption, VideoRow } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";
import BottomSheet from "@/components/ui/BottomSheet";

interface LaporkanSheetProps {
  video: VideoRow | null;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_OPTIONS: { action: ReportOption; label: string; description: string; icon: typeof Bug; color: string }[] = [
  {
    action: "REPORT_HOAX",
    label: "Berita Bohong",
    description: "Informasi yang tidak benar dan bisa menyesatkan",
    icon: Bug,
    color: "text-Score-Gold",
  },
  {
    action: "REPORT_AI",
    label: "AI Fake",
    description: "Konten palsu yang dibuat oleh kecerdasan buatan",
    icon: Bot,
    color: "text-Action-Secondary",
  },
];

export default function LaporkanSheet({ video, isOpen, onClose }: LaporkanSheetProps) {
  const handleInteraction = useGameStore((s) => s.handleInteraction);

  const handleChoose = (action: ReportOption) => {
    if (!video) return;
    handleInteraction(video.id, video.category, action);
    onClose();
  };

  if (!video) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <h3 className="font-display text-lg font-bold text-Text-Primary mb-1">
        Ini berbahaya! 🚩
      </h3>
      <p className="font-body text-Text-Secondary text-sm mb-5">
        Pilih jenis konten berbahaya yang paling tepat.
      </p>

      <div className="flex flex-col gap-3">
        {REPORT_OPTIONS.map(({ action, label, description, icon: Icon, color }) => (
          <motion.button
            key={action}
            onClick={() => handleChoose(action)}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-4 rounded-2xl bg-Surface-Card-Alt p-4 text-left active:bg-Surface-Card transition-colors"
          >
            <span className="w-12 h-12 shrink-0 rounded-full bg-Brand-Deep/60 flex items-center justify-center">
              <Icon className={`w-6 h-6 ${color}`} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-Text-Primary text-sm">{label}</p>
              <p className="font-body text-Text-Muted text-xs mt-0.5 leading-snug">{description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-5 flex items-center justify-center gap-2 rounded-full py-3 font-body font-semibold text-Text-Secondary"
      >
        <X className="w-4 h-4" />
        Batal
      </button>
    </BottomSheet>
  );
}
