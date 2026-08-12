"use client";

/**
 * app/page.tsx — Welcome / mode-select screen (/)
 *
 * Layout: top rainbow arcs → logo → subtitle → mode buttons → robots at bottom.
 * Content flows from the top (not vertically centred) to match the reference design.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGameStore } from "@/hooks/useGameStore";
import type { GameMode } from "@/lib/types";

export default function WelcomePage() {
  const router = useRouter();
  const setGameMode = useGameStore((s) => s.setGameMode);
  const resetSession = useGameStore((s) => s.resetSession);
  const [pressed, setPressed] = useState<GameMode | null>(null);

  const handleSelect = (mode: GameMode) => {
    if (pressed) return;
    setPressed(mode);
    setGameMode(mode);
    resetSession();
    const query = typeof window !== "undefined" ? window.location.search : "";
    setTimeout(() => router.push("/game/onboarding" + query), 300);
  };

  return (
    <main
      className="relative h-full w-full flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f9f5ff 0%, #ffffff 45%, #fdf0f8 100%)" }}
    >
      {/* ══════════════════════════════════════
          Top Rainbow Arcs
          Three concentric U-shaped arcs: Purple › Pink › Orange
      ══════════════════════════════════════ */}
      <div className="absolute top-0 inset-x-0 pointer-events-none" aria-hidden>
        <svg viewBox="0 0 430 200" className="w-full" fill="none">
          {/* Outermost — Purple */}
          <path d="M -50 12 A 490 490 0 0 0 480 12" stroke="#b596e7" strokeWidth="26" strokeLinecap="round" />
          {/* Middle — Pink */}
          <path d="M -50 52 A 530 530 0 0 0 480 52" stroke="#f481ac" strokeWidth="26" strokeLinecap="round" />
          {/* Innermost — Orange */}
          <path d="M -50 92 A 570 570 0 0 0 480 92" stroke="#f99d6d" strokeWidth="26" strokeLinecap="round" />
        </svg>
      </div>

      {/* ══════════════════════════════════════
          Main content — flows from top
      ══════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center w-full pt-[100px]">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
        >
          <Image
            src="/assets/logo_get_calmer.png"
            alt="Get Calmer"
            width={360}
            height={180}
            priority
            className="object-contain drop-shadow-lg w-[340px] md:w-[380px] h-auto"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="mt-1 font-display text-[14px] md:text-[15px] text-center px-6"
          style={{ color: "#3B3669" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Simulasi Cerdas Bermedia Sosial
        </motion.p>

        {/* Mode Buttons */}
        <motion.div
          className="flex flex-col items-center gap-0 mt-8 md:mt-12 w-full max-w-[290px] md:max-w-[340px] px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 22 }}
        >
          {/* Mode Normal */}
          <motion.button
            onClick={() => handleSelect("NORMAL")}
            whileTap={{ scale: 0.93 }}
            className="w-full cursor-pointer select-none focus:outline-none"
            aria-label="Pilih Mode Normal"
          >
            <Image
              src="/assets/button_normal.png"
              alt="Mode Normal"
              width={240}
              height={160}
              className="w-full h-auto object-contain drop-shadow"
            />
          </motion.button>

          {/* Mode Tantangan */}
          <motion.button
            onClick={() => handleSelect("HARD")}
            whileTap={{ scale: 0.93 }}
            className="w-full cursor-pointer select-none focus:outline-none -mt-1"
            aria-label="Pilih Mode Tantangan"
          >
            <Image
              src="/assets/button_tantangan.png"
              alt="Mode Tantangan"
              width={240}
              height={160}
              className="w-full h-auto object-contain drop-shadow"
            />
          </motion.button>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════
          Bottom — Robots + Rainbow Arcs
      ══════════════════════════════════════ */}

      {/* Bottom Rainbow Arcs — behind robots */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none" aria-hidden>
        <svg viewBox="0 0 430 260" className="w-full" fill="none">
          {/* Innermost — Orange/Peach */}
          <path d="M -50 26 A 420 420 0 0 0 480 26" stroke="#efa086" strokeWidth="24" strokeLinecap="round" />
          {/* Light Lavender */}
          <path d="M -50 64 A 450 450 0 0 0 480 64" stroke="#d3cbf0" strokeWidth="24" strokeLinecap="round" />
          {/* Dark Pink */}
          <path d="M -50 100 A 480 480 0 0 0 480 100" stroke="#d36aa2" strokeWidth="24" strokeLinecap="round" />
          {/* Light Lavender */}
          <path d="M -50 136 A 510 510 0 0 0 480 136" stroke="#dbcef9" strokeWidth="24" strokeLinecap="round" />
          {/* Purple */}
          <path d="M -50 171 A 540 540 0 0 0 480 171" stroke="#8b7ae2" strokeWidth="24" strokeLinecap="round" />
        </svg>
      </div>

      {/* Tito — bottom-left */}
      <motion.div
        className="absolute -bottom-2 -left-2 z-10 pointer-events-none w-[130px] md:w-[170px]"
        initial={{ opacity: 0, x: -30, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 180, damping: 20 }}
      >
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/assets/tito.png"
            alt="Tito si robot teal"
            width={170}
            height={220}
            className="object-contain w-full h-auto"
          />
        </motion.div>
      </motion.div>

      {/* Tita — bottom-right */}
      <motion.div
        className="absolute -bottom-1 -right-1 z-10 pointer-events-none w-[120px] md:w-[160px]"
        initial={{ opacity: 0, x: 30, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 180, damping: 20 }}
      >
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <Image
            src="/assets/tita.png"
            alt="Tito"
            width={160}
            height={220}
            className="object-contain w-full h-auto"
          />
        </motion.div>
      </motion.div>

      {/* Footer tagline & Teacher Access */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 w-full px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        <Link
          href="/teacher/login"
          className="font-display text-[11px] font-bold text-[#1A2A5E] transition px-4 py-1.5 rounded-full shadow-sm mt-1"
          style={{ background: "#C6F516", border: "1px solid #8CBE11" }}
        >
          Akses Portal Guru
        </Link>
      </motion.div>
    </main>
  );
}
