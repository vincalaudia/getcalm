"use client";

/**
 * app/tutorial/page.tsx — 4-slide onboarding tutorial
 *
 * Flow: / (mode select) → /tutorial → /play
 *
 * Slide 1 — Kenalan sama Tita & misi detektif fakta
 * Slide 2 — Cara pakai LIKE & BAGIKAN
 * Slide 3 — Cara pakai tombol CEK (quota hint for HARD mode)
 * Slide 4 — Baterai Fokus & cara hemat
 *
 * Style: sama dengan halaman utama (pastel BG + rainbow arcs + KG Blank Space Solid).
 * Bahasa: mudah untuk anak kelas 4 SD.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useGameStore } from "@/hooks/useGameStore";

const TOTAL = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 260, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "tween" as const, duration: 0.3 } },
  exit: (dir: number) => ({ x: -dir * 260, opacity: 0, transition: { type: "tween" as const, duration: 0.22 } }),
};

/* ─────────────────────────────────────────────────────────── */
/*  Root Component                                             */
/* ─────────────────────────────────────────────────────────── */
export default function TutorialPage() {
  const router = useRouter();
  const gameMode = useGameStore((s) => s.gameMode) ?? "NORMAL";
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const goNext = () => {
    if (step < TOTAL - 1) { setDir(1); setStep((s) => s + 1); }
    else router.push("/play");
  };
  const goPrev = () => {
    if (step > 0) {
      setDir(-1);
      setStep((s) => s - 1);
    } else {
      router.push("/");
    }
  };

  return (
    <main
      className="relative h-full w-full flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f9f5ff 0%, #ffffff 50%, #fdf0f8 100%)" }}
    >
      {/* ── Progress bar ── */}
      <div className="relative z-10 flex gap-[6px] px-8 pt-8">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <motion.div
            key={i}
            className="h-[6px] rounded-full flex-1"
            animate={{ backgroundColor: i <= step ? "#8b7ae2" : "#e0d8f8" }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      <p className="relative z-10 text-center font-body text-[10px] mt-1" style={{ color: "#b0a0c8" }}>
        {step + 1} / {TOTAL}
      </p>

      {/* ── Slide Content ── */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex flex-col items-center px-5 pt-16 pb-2 overflow-y-auto"
          >
            {step === 0 && <Slide1 />}
            {step === 1 && <Slide2 />}
            {step === 2 && <Slide3 gameMode={gameMode as "NORMAL" | "HARD"} />}
            {step === 3 && <Slide4 />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <div className="relative z-10 flex items-center gap-3 px-6 pb-16">
        <button
          onClick={goPrev}
          className="py-3 px-6 rounded-full font-display font-bold text-[14px] btn-secondary flex-shrink-0"
        >
          ← Kembali
        </button>

        <button
          onClick={goNext}
          className="flex-1 py-3 px-6 rounded-full font-display font-bold text-[14px] btn-primary"
        >
          {step === TOTAL - 1 ? "Mulai Petualangan! 🚀" : "Lanjut →"}
        </button>
      </div>

      {/* ── Bottom Rainbow Arcs ── */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none z-0" aria-hidden>
        <svg viewBox="0 0 430 120" className="w-full" fill="none">
          <path d="M -50 -8 A 420 420 0 0 0 480 -8" stroke="#efa086" strokeWidth="18" strokeLinecap="round" />
          <path d="M -50 22 A 450 450 0 0 0 480 22" stroke="#d3cbf0" strokeWidth="18" strokeLinecap="round" />
          <path d="M -50 52 A 480 480 0 0 0 480 52" stroke="#d36aa2" strokeWidth="18" strokeLinecap="round" />
          <path d="M -50 82 A 510 510 0 0 0 480 82" stroke="#dbcef9" strokeWidth="18" strokeLinecap="round" />
          <path d="M -50 112 A 540 540 0 0 0 480 112" stroke="#8b7ae2" strokeWidth="18" strokeLinecap="round" />
        </svg>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Shared Sub-Components                                      */
/* ─────────────────────────────────────────────────────────── */

/** Speech bubble with a triangle tail pointing up */
function ChatBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full mt-1">
      {/* Tail */}
      <div
        className="absolute -top-2.5 left-10 w-5 h-5 rotate-45"
        style={{
          background: "white",
          border: "2px solid #e8d8ff",
          borderBottom: "none",
          borderRight: "none",
          borderRadius: "2px",
        }}
      />
      <div
        className="relative rounded-2xl px-4 py-3 font-body text-[12.5px] leading-relaxed"
        style={{
          background: "white",
          border: "2px solid #e8d8ff",
          boxShadow: "0 4px 16px rgba(139,122,226,0.1)",
          color: "#3B3669",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Icon + text bullet point */
function Bullet({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-lg mt-0.5 flex-shrink-0 leading-none">{icon}</span>
      <p className="font-body text-[12px] leading-relaxed" style={{ color: "#3B3669" }}>{text}</p>
    </div>
  );
}

/** Tinted info card */
function InfoCard({ children, color = "#f3eeff", border = "#d8c8ff" }: { children: React.ReactNode; color?: string; border?: string }) {
  return (
    <div
      className="w-full rounded-2xl px-4 py-3 flex flex-col gap-2"
      style={{ background: color, border: `1.5px solid ${border}` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Slide 1 — Kenalan sama Tita                               */
/* ─────────────────────────────────────────────────────────── */
function Slide1() {
  const studentName = useGameStore((s) => s.studentName) || "Teman";
  const firstName = studentName.split(" ")[0];

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="font-display text-[20px] text-center" style={{ color: "#3B3669" }}>
        Hai {firstName}! 👋
      </h1>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-24"
      >
        <Image src="/assets/tita.png" alt="Tita" width={100} height={130} className="object-contain" />
      </motion.div>

      <ChatBubble>
        <p><strong>Kenalin, aku Tita! 🤖✨</strong></p>
        <p className="mt-1">
          Aku robot detektif fakta yang lucu! Aku punya misi penting di media sosial <strong>GetCalm</strong>...
        </p>
        <p className="mt-1">
          Di sana banyak video beredar. Ada yang <strong>beneran ✅</strong>, tapi ada juga yang{" "}
          <strong>hoaks 🚨</strong> atau <strong>palsu buatan AI 🤖</strong>!
        </p>
      </ChatBubble>

      <InfoCard color="#f0f7ff" border="#c8deff">
        <p className="font-display text-[13px]" style={{ color: "#4a6fa5" }}>🎯 Misi Kita Bareng:</p>
        <Bullet icon="✅" text="Bagikan berita yang benar ke Tito, temen aku!" />
        <Bullet icon="🚨" text="Laporkan konten hoaks atau yang dibuat AI palsu" />
        <Bullet icon="⭐" text="Kumpulkan Skor Fakta setinggi mungkin — semakin tinggi, semakin jago!" />
      </InfoCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Slide 2 — Like & Bagikan                                  */
/* ─────────────────────────────────────────────────────────── */
function Slide2() {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="font-display text-[20px] text-center" style={{ color: "#3B3669" }}>
        Like & Bagikan! ❤️📤
      </h1>

      {/* Both mascots */}
      <div className="flex items-end justify-center gap-6">
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <Image src="/assets/tita.png" alt="Tita" width={70} height={90} className="object-contain" />
        </motion.div>
        <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
          <Image src="/assets/tito.png" alt="Tito" width={70} height={90} className="object-contain" />
        </motion.div>
      </div>

      <ChatBubble>
        <p>Kalau ketemu video yang <strong>beneran dan bagus</strong>, kamu bisa pakai 2 tombol ini:</p>
      </ChatBubble>

      <InfoCard color="#fff0f7" border="#ffd6e8">
        <Bullet icon="❤️" text="LIKE — buat video yang kamu suka dan akurat. Tapi jangan like yang hoaks ya, bisa dikurang nilainya!" />
        <Bullet icon="📤" text="BAGIKAN — kirim ke Tito! Tapi hanya bagikan yang beneran, bukan hoaks. Tito percaya sama kamu lho 😊" />
      </InfoCard>

      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(244,129,172,0.12) 0%, rgba(255,212,0,0.12) 100%)", border: "1.5px solid #ffd6e8" }}
      >
        <p className="font-display text-[12px]" style={{ color: "#d36aa2" }}>
          ⭐ Makin banyak like/share yang tepat = Skor Fakta makin naik!
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Slide 3 — Tombol CEK                                      */
/* ─────────────────────────────────────────────────────────── */
function Slide3({ gameMode }: { gameMode: "NORMAL" | "HARD" }) {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="font-display text-[20px] text-center" style={{ color: "#3B3669" }}>
        Ragu-Ragu? CEK Dulu! 🔍
      </h1>

      {/* Animated CEK icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{
          background: "linear-gradient(135deg, #8b7ae2 0%, #2FB6C9 100%)",
          boxShadow: "0 4px 20px rgba(139,122,226,0.4)",
        }}
      >
        🔍
      </motion.div>

      <ChatBubble>
        <p>
          Kalau kamu <strong>ragu</strong> nih, apakah sebuah video itu beneran atau hoaks — jangan langsung percaya!
          Gunakan tombol <strong>CEK</strong> dulu!
        </p>
      </ChatBubble>

      <InfoCard color="#f3eeff" border="#d8c8ff">
        <p className="font-display text-[12px]" style={{ color: "#8b7ae2" }}>CEK bisa kasih tahu:</p>
        <Bullet icon="🤖" text="Apakah video ini ada tanda-tanda dibuat AI?" />
        <Bullet icon="✅" text="Apa fakta sesungguhnya yang terjadi?" />
      </InfoCard>

      {/* Mode-aware quota card */}
      {gameMode === "HARD" ? (
        <InfoCard color="#fff5f5" border="#ffc0c0">
          <Bullet
            icon="⚠️"
            text="Mode Tantangan: Kamu cuma punya 5x kuota CEK per sesi! Gunakan hanya saat benar-benar ragu ya, jangan boros! 🧠"
          />
        </InfoCard>
      ) : (
        <InfoCard color="#f0fff4" border="#b2f2bb">
          <Bullet
            icon="💡"
            text="Mode Santai: CEK bisa dipakai sebanyak yang kamu mau! Manfaatkan sebaik-baiknya! ✨"
          />
        </InfoCard>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Slide 4 — Baterai Fokus                                   */
/* ─────────────────────────────────────────────────────────── */
function Slide4() {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h1 className="font-display text-[20px] text-center" style={{ color: "#3B3669" }}>
        Jaga Baterai Fokusmu! 🔋
      </h1>

      {/* Animated battery */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="text-5xl"
      >
        🔋
      </motion.div>

      <ChatBubble>
        <p>
          Kamu punya <strong>Baterai Fokus</strong> yang terus berkurang kalau kebanyakan nonton video.
          Kalau baterai habis — sesi selesai! Jadi harus cepet dan cerdas ya! ⚡
        </p>
      </ChatBubble>

      <InfoCard color="#fff9f0" border="#ffddb0">
        <Bullet icon="🎭" text="Video hiburan atau tidak penting → baterai lebih cepat habis! Hati-hati kalau terlalu lama!" />
        <Bullet icon="📰" text="Berita nyata yang penting → baterai lebih hemat. Yuk serius bacanya!" />
        <Bullet icon="🧠" text="Tetap baca baik-baik ya pas verifikasi fakta — jangan buru-buru!" />
      </InfoCard>

      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(139,122,226,0.1) 0%, rgba(244,129,172,0.1) 100%)", border: "1.5px solid rgba(139,122,226,0.2)" }}
      >
        <p className="font-display text-[12px]" style={{ color: "#8b7ae2" }}>
          Siap jadi Detektif Fakta terhebat? Yuk, mulai! 🦸‍♀️
        </p>
      </div>
    </div>
  );
}
