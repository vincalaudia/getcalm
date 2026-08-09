"use client";

/**
 * components/play/Hud.tsx
 *
 * Top HUD bar:
 *   Left  — Fact Score pill + animated delta toast when score changes
 *   Centre — CEK quota badge (HARD mode only)
 *   Right  — Focus Battery pill + "Selesai Scrolling" button
 *
 * The "Selesai Scrolling" button now lives in the HUD (top) so it never
 * overlaps feed content. A pulsing glow ring animates behind it to keep
 * it discoverable without blocking the video.
 *
 * Score delta toast: every time currentFactScore changes a "+N" or "-N"
 * chip floats up from the score pill, turns green/red, and fades out.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Search } from "lucide-react";
import { useGameStore } from "@/hooks/useGameStore";
import ConfirmEndModal from "./ConfirmEndModal";

function batteryColor(pct: number) {
  if (pct > 50) return "bg-Battery-High";
  if (pct > 20) return "bg-Battery-Mid";
  return "bg-Battery-Low";
}

// One entry in the toast queue
interface DeltaToast {
  id: number;
  delta: number;
}

let toastIdCounter = 0;

export default function Hud() {
  const currentFactScore = useGameStore((s) => s.currentFactScore);
  const currentFocusBattery = useGameStore((s) => s.currentFocusBattery);
  const gameMode = useGameStore((s) => s.gameMode);
  const checkQuotaLeft = useGameStore((s) => s.checkQuotaLeft);

  const isCritical = currentFocusBattery <= 20;
  const showQuota = gameMode === "HARD";

  const [showConfirm, setShowConfirm] = useState(false);

  // ── Score delta toasts ──────────────────────────────────────────────
  const prevScoreRef = useRef(currentFactScore);
  const [toasts, setToasts] = useState<DeltaToast[]>([]);

  useEffect(() => {
    const delta = currentFactScore - prevScoreRef.current;
    prevScoreRef.current = currentFactScore;
    if (delta === 0) return;

    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, delta }]);

    // Auto-remove after animation completes (1.4 s)
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1400);
    return () => clearTimeout(timer);
  }, [currentFactScore]);

  return (
    <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-1 shrink-0">
        {/* ── Fact Score pill + delta toasts ── */}
        <div className="relative flex items-center gap-1.5 rounded-full bg-Surface-Glass backdrop-blur-md px-3 py-1.5 shadow-lg shrink-0">
          <Star className="w-4 h-4 text-Score-Gold fill-Score-Gold" strokeWidth={2} />
          <span className="font-display font-bold text-Text-Primary text-sm tabular-nums">
            {currentFactScore}
          </span>

          {/* Floating delta chips */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-0.5">
            <AnimatePresence>
              {toasts.map((toast) => {
                const isPositive = toast.delta > 0;
                return (
                  <motion.span
                    key={toast.id}
                    initial={{ opacity: 1, y: 0, scale: 0.85 }}
                    animate={{ opacity: 0, y: -36, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="font-display font-bold text-xs tabular-nums whitespace-nowrap rounded-full px-2 py-0.5"
                    style={{
                      color: isPositive ? "#4ADE80" : "#FF4D6D",
                      background: isPositive ? "rgba(74,222,128,0.15)" : "rgba(255,77,109,0.15)",
                      border: `1px solid ${isPositive ? "rgba(74,222,128,0.4)" : "rgba(255,77,109,0.4)"}`,
                    }}
                  >
                    {isPositive ? `+${toast.delta}` : `${toast.delta}`}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        {/* CEK Quota badge (HARD mode only) */}
        {showQuota && (
          <motion.div
            className="flex items-center gap-1 rounded-full bg-Surface-Glass backdrop-blur-md px-2.5 py-1.5 shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="w-3.5 h-3.5 text-Action-Secondary" strokeWidth={2.5} />
            <span
              className={`font-display font-bold text-[12px] tabular-nums ${checkQuotaLeft <= 1 ? "text-Danger-Flag animate-battery-pulse" : "text-Action-Secondary"
                }`}
            >
              {checkQuotaLeft <= 0 ? "0" : checkQuotaLeft}
            </span>
            {/* <span className="font-body text-Text-Muted text-[12px]">CEK</span> */}
          </motion.div>
        )}
      </div>

      {/* ── Selesai — absolute center, bright gradient pill ── */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <button
          onClick={() => setShowConfirm(true)}
          className="font-display font-bold text-[14px] rounded-full px-4 py-2 btn-primary-sm"
        >
          Selesai
        </button>
      </div>

      <ConfirmEndModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} />

      {/* ── Right side: CEK Quota + Battery ── */}


      {/* Focus Battery pill */}
      <div
        className={`flex items-center gap-1.5 rounded-full bg-Surface-Glass backdrop-blur-md pl-2 pr-2.5 py-1.5 shadow-lg ${isCritical ? "animate-battery-pulse" : ""
          }`}
      >
        <div className="w-5 h-2.5 rounded-sm border border-Text-Muted relative overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 ${batteryColor(currentFocusBattery)}`}
            animate={{ width: `${Math.max(0, Math.min(100, currentFocusBattery))}%` }}
            transition={{ type: "tween", duration: 0.4 }}
          />
        </div>
        <span className="font-body font-semibold text-Text-Primary text-[14px] tabular-nums">
          {Math.max(0, Math.round(currentFocusBattery))}%
        </span>
      </div>
    </div>
  );
}
