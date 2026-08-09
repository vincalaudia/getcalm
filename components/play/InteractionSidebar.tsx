"use client";

/**
 * components/play/InteractionSidebar.tsx
 *
 * Per-button locking model:
 *   - LIKE:     disabled once clicked (likedAt = true). Others still active.
 *   - SHARE:    disabled once clicked (sharedAt = true). Others still active.
 *   - CEK:      gated by quota in HARD mode. Always re-usable in NORMAL.
 *   - LAPORKAN: disabled until hasChecked; also disabled after report submitted.
 */
import { motion } from "framer-motion";
import { Heart, Send, Search, Flag } from "lucide-react";
import type { VideoRow } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";

interface InteractionSidebarProps {
  video: VideoRow;
  onOpenCek: (video: VideoRow) => void;
  onOpenLaporkan: (video: VideoRow) => void;
  onOpenBagikan: (video: VideoRow) => void;
}

export default function InteractionSidebar({ video, onOpenCek, onOpenLaporkan, onOpenBagikan }: InteractionSidebarProps) {
  const videoState = useGameStore((s) => s.videoStates[video.id]);
  const gameMode = useGameStore((s) => s.gameMode);
  const checkQuotaLeft = useGameStore((s) => s.checkQuotaLeft);
  const handleInteraction = useGameStore((s) => s.handleInteraction);

  const hasChecked = videoState?.hasChecked ?? false;
  const likedAt = videoState?.likedAt ?? false;
  const sharedAt = videoState?.sharedAt ?? false;
  const reportAction = videoState?.reportAction ?? null;

  const cekQuotaExhausted = gameMode === "HARD" && checkQuotaLeft <= 0;

  // Each button has its own independent disabled rule.
  const likeDisabled = likedAt;
  const shareDisabled = sharedAt;
  // CEK: permanently disabled after first use (hasChecked), or when quota runs out.
  const cekDisabled = hasChecked || cekQuotaExhausted;
  const laporkanDisabled = !hasChecked || reportAction !== null;

  return (
    <aside className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-5">
      {/* Author avatar */}
      <div className="w-11 h-11 rounded-full bg-Action-Primary flex items-center justify-center font-display font-bold text-Text-Primary border-2 border-Text-Primary/40 mb-1">
        {video.author_username.replace("@", "").slice(0, 2).toUpperCase()}
      </div>

      <SidebarButton
        icon={<Heart className={likedAt ? "fill-Danger-Flag text-Danger-Flag" : ""} />}
        label="Suka"
        disabled={likeDisabled}
        done={likedAt}
        onClick={() => handleInteraction(video.id, video.category, "LIKE")}
      />

      <SidebarButton
        icon={<Send className={sharedAt ? "fill-Action-Primary-Soft text-Action-Primary-Soft" : ""} />}
        label="Bagikan"
        disabled={shareDisabled}
        done={sharedAt}
        onClick={() => onOpenBagikan(video)}
      />

      <SidebarButton
        icon={<Search className={hasChecked ? "text-Action-Secondary" : ""} />}
        label="CEK"
        disabled={cekDisabled}
        glow={!cekDisabled}
        onClick={() => onOpenCek(video)}
      />

      <SidebarButton
        icon={<Flag className={reportAction ? "fill-Danger-Flag text-Danger-Flag" : ""} />}
        label="Laporkan"
        disabled={laporkanDisabled}
        done={reportAction !== null}
        hint={!hasChecked && reportAction === null ? "Cek Dulu" : undefined}
        onClick={() => onOpenLaporkan(video)}
      />
    </aside>
  );
}

// ---------------------------------------------------------------------------
function SidebarButton({
  icon,
  label,
  disabled,
  glow,
  done,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  glow?: boolean;
  done?: boolean;       // button was successfully used (shows at reduced opacity with filled icon)
  hint?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.88 }}
      className="flex flex-col items-center gap-1 transition-opacity duration-200"
      style={{
        opacity: disabled ? 0.38 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 text-Text-Primary transition-all duration-200 ${glow && !disabled
          ? "bg-Action-Secondary shadow-glow-secondary"
          : done
            ? "bg-Surface-Card-Alt ring-1 ring-white/25"
            : "bg-Surface-Glass backdrop-blur-md"
          }`}
      >
        {icon}
      </span>
      <span className="font-body text-[11px] text-Text-Secondary">{label}</span>
      {hint && (
        <span className="font-body text-[9px] text-Text-Muted -mt-0.5">{hint}</span>
      )}
    </motion.button>
  );
}
