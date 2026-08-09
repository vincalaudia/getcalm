"use client";

/**
 * components/ui/BottomSheet.tsx
 *
 * Generic slide-up bottom sheet shell: dims the feed behind it, traps the
 * content in a rounded panel anchored to the bottom of the phone frame,
 * and closes on backdrop tap. Shared by CekSheet and LaporkanSheet so both
 * "ramah anak" sheets in Section 3 look and animate identically.
 */
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-Surface-Card px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[75%] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-Text-Muted/40" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
