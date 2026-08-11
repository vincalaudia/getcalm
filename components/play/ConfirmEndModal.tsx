"use client";

/**
 * components/play/ConfirmEndModal.tsx
 *
 * Confirmation dialog shown when the player presses "Selesai".
 * Appears as a centered glassy card over a blurred backdrop.
 * Two actions: "Lanjut Dulu" (dismiss) and "Selesai!" (confirm end session).
 */
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useGameStore } from "@/hooks/useGameStore";

interface ConfirmEndModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfirmEndModal({ isOpen, onClose }: ConfirmEndModalProps) {
  const endSession = useGameStore((s) => s.endSession);

  const handleConfirm = () => {
    onClose();
    endSession();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            key="card"
            className="fixed inset-x-0 z-[100] flex flex-col items-center justify-center p-6 pointer-events-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
            initial={{ opacity: 0, scale: 0.88, y: "-45%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: "-47%" }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <div className="relative w-[320px] flex flex-col items-center pointer-events-auto">
              {/* Background Container */}
              <Image
                src="/assets/confirmation.png"
                alt="Confirm Background"
                width={320}
                height={460}
                className="w-full h-auto object-contain drop-shadow-xl"
                priority
              />

              {/* Foreground Content */}
              <div className="absolute inset-0 flex flex-col items-center pt-[230px] px-8 text-center">
                <h2 className="font-display font-extrabold text-[#194b39] text-[22px] leading-tight mb-2">
                  Yakin sudah<br />selesai scrolling?
                </h2>
                <p className="font-body text-[#1a2a5e] font-medium text-xs leading-relaxed mb-2">
                  kalau sudah cukup, lanjut ke kuis yuk.
                </p>

                {/* Actions */}
                <div className="w-full flex flex-col gap-1">
                  <button
                    onClick={handleConfirm}
                    className="relative w-full select-none active:translate-y-1 transition-transform"
                  >
                    <Image src="/assets/primary_big_button.png" alt="Selesai" width={400} height={60} className="w-full object-fill drop-shadow-sm" style={{ height: 48 }} />
                    <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-[13px]" style={{ color: "#0B0E24" }}>
                      Selesai, lanjut kuis! 🚀
                    </span>
                  </button>

                  <button
                    onClick={onClose}
                    className="relative w-full select-none active:translate-y-1 transition-transform"
                  >
                    <Image src="/assets/primary_big_button.png" alt="Lanjut dulu" width={400} height={60} className="w-full object-fill drop-shadow-sm" style={{ height: 48, filter: "hue-rotate(280deg) saturate(1.8) brightness(0.85)" }} />
                    <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-[13px] text-white">
                      Kembali scrolling
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
