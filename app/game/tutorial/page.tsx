"use client";

/**
 * app/tutorial/page.tsx — 4-slide onboarding tutorial
 *
 * Flow: / (mode select) → /tutorial → /play
 *
 * Slide 1 — Kenalan sama Tito & misi detektif fakta
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
    else router.push("/game/play");
  };
  const goPrev = () => {
    if (step > 0) {
      setDir(-1);
      setStep((s) => s - 1);
    } else {
      router.push("/game");
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
            className="absolute inset-0 flex flex-col items-center px-5 pt-6 pb-2 overflow-y-auto"
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
          className="flex-1 py-3 px-6 rounded-full font-display font-bold text-[14px] btn-primary flex items-center justify-center"
        >
          {step === TOTAL - 1 ? "Mulai Sekarang!" : "Lanjut →"}
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
/*  Slide 1 — Kenalan sama Tito                               */
/* ─────────────────────────────────────────────────────────── */
function Slide1() {
  const studentName = useGameStore((s) => s.studentName) || "Teman";
  const firstName = studentName.split(" ")[0];

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <h1 className="font-display text-[20px] text-center" style={{ color: "#3B3669" }}>
        Hai {firstName}! 👋
      </h1>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-45"
      >
        <Image src="/assets/tito_hi.gif" alt="Tito" width={240} height={200} className="object-contain" />
      </motion.div>

      <ChatBubble>
        <p><strong>Kenalin, aku Tito! 🤖✨</strong></p>
        <p className="mt-1">
          Aku robot detektif fakta yang lucu! Aku punya misi penting di media sosial <strong>ThinkTok</strong>...
        </p>
        <p className="mt-1">
          Di sana banyak video beredar. Ada yang <strong>faktual ✅</strong>, tapi ada juga yang{" "}
          <strong>hoaks 🚨</strong> atau <strong>palsu buatan AI 🤖</strong>!
        </p>
      </ChatBubble>

      <InfoCard color="#f0f7ff" border="#c8deff">
        <p className="font-display text-[13px]" style={{ color: "#4a6fa5" }}>🎯 Misi Kita Bareng:</p>
        <Bullet icon="✅" text="Like dan bagikan berita yang benar ke Tita, temanku!" />
        <Bullet icon="🚨" text="Laporkan konten hoaks atau yang dibuat AI palsu" />
        <Bullet icon="⭐" text="Kumpulkan Skor Total setinggi mungkin dari skor fakta dan kuis! Semakin banyak aksi yang benar, semakin tinggi skormu!" />
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
      <div className="flex items-end justify-center">
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <Image src="/assets/mascots_send.gif" alt="Sending" width={300} height={120} className="object-contain" />
        </motion.div>

      </div>

      <ChatBubble>
        <p>Kalau ketemu video <strong>edukasi</strong> atau berita yang <strong>faktual</strong>, kamu bisa pakai 2 tombol ini:</p>
      </ChatBubble>

      <InfoCard color="#fff0f7" border="#ffd6e8">
        <Bullet icon="❤️" text="Like: sukai video yang benar. Tapi jangan like yang hoaks ya, bisa dikurangi nilainya!" />
        <Bullet icon="📤" text="Bagikan: kirim ke Tita! Tapi hanya bagikan yang edukatif dan faktual, bukan hoaks. Tita percaya sama kamu lho 😊" />
      </InfoCard>
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

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-45"
      >
        <Image src="/assets/check_tutorial.gif" alt="cek" width={240} height={200} className="object-contain" />
      </motion.div>

      <ChatBubble>
        <p>
          Kalau kamu <strong>ragu</strong> apakah sebuah video itu beneran atau hoaks...kamu bisa gunakan tombol <strong>CEK</strong> dulu!
        </p>
      </ChatBubble>

      <InfoCard color="#f3eeff" border="#d8c8ff">
        <p className="font-display text-[12px]" style={{ color: "#8b7ae2" }}>CEK bisa kasih tahu:</p>
        <Bullet icon="🤖" text="Apakah video ini ada tanda-tanda dibuat AI?" />
        <Bullet icon="✅" text="Apa fakta sesungguhnya yang terjadi?" />
      </InfoCard>

      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(244,129,172,0.12) 0%, rgba(255,212,0,0.12) 100%)", border: "1.5px solid #ffd6e8" }}
      >
        <p className="font-display text-[11px]" style={{ color: "#c84646ff" }}>
          Kalau kamu sudah yakin videonya hoaks/AI, kamu bisa langsung klik <strong>Laporkan</strong>! 😎
        </p>
      </div>

      {/* Mode-aware quota card */}
      {gameMode === "HARD" ? (
        <InfoCard color="#fff5f5" border="#ffc0c0">
          <Bullet
            icon="⚠️"
            text="Mode Tantangan: Kamu cuma punya 5x kuota CEK per sesi! Manfaatkan sebaik-baiknya"
          />
        </InfoCard>
      ) : (
        <InfoCard color="#f0fff4" border="#b2f2bb">
          <Bullet
            icon="💡"
            text="Mode Normal: CEK bisa dipakai sebanyak yang kamu mau! Manfaatkan sebaik-baiknya! ✨"
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
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-45"
      >
        <Image src="/assets/battery_tutorial.gif" alt="baterai" width={240} height={200} className="object-contain" />
      </motion.div>

      <ChatBubble>
        <p>
          Kamu punya <strong>Baterai Fokus</strong> yang terus berkurang kalau kebanyakan nonton video.
          Kalau baterai habis, maka sesi selesai! Jadi harus waspada ya! ⚡
        </p>
      </ChatBubble>

      <InfoCard color="#fff9f0" border="#ffddb0">
        <Bullet icon="🎭" text="Baterai akan lebih cepat habis pada video hiburan atau tidak penting!" />
        <Bullet icon="📰" text="Baterai akan lebih hemat pada video berita nyata atau edukasi!" />
      </InfoCard>

      <InfoCard color="rgba(214, 236, 255, 0.47)" border="#6cb8eaff">
        <Bullet icon="🧠" text="Di akhir kamu dapat klik selesai, dan mengikuti quiz tentang video yang kamu lihat. Kesempatan untuk menambah poin" />
      </InfoCard>

      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(139,122,226,0.1) 0%, rgba(244,129,172,0.1) 100%)", border: "1.5px solid rgba(139,122,226,0.2)" }}
      >
        <p className="font-display text-[12px]" style={{ color: "#8b7ae2" }}>
          Siap jadi Detektif Fakta terhebat? Yuk, mulai!
        </p>
      </div>
    </div>
  );
}
