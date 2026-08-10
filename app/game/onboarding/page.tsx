"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/hooks/useGameStore";
import { validateClassCode } from "@/lib/supabaseClient";
import { useEffect } from "react";

type Step = "code" | "name";

export default function OnboardingPage() {
  const router = useRouter();
  const setStudentName = useGameStore((s) => s.setStudentName);
  const setClassCode = useGameStore((s) => s.setClassCode);

  const [step, setStep] = useState<Step>("code");
  const [codeInput, setCodeInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Read ?code= from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("code");
      if (codeParam) {
        const trimmed = codeParam.toUpperCase().trim();
        setCodeInput(trimmed);
        
        // Auto-validate and jump to name step
        setIsLoading(true);
        validateClassCode(trimmed).then(result => {
          setIsLoading(false);
          if (result) {
            setClassCode(trimmed);
            setStep("name");
          } else {
            setCodeError("Kode kelas dari URL tidak ditemukan atau tidak aktif.");
          }
        });
      }
    }
  }, [setClassCode]);

  const handleCodeNext = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) { handleSkip(); return; }
    setIsLoading(true);
    setCodeError(null);
    const result = await validateClassCode(trimmed);
    setIsLoading(false);
    if (!result) {
      setCodeError("Kode kelas tidak ditemukan atau sudah tidak aktif. Coba lagi atau klik Lewati.");
      return;
    }
    setClassCode(trimmed);
    setStep("name");
  };

  const handleSkip = () => { setClassCode(null); setStep("name"); };

  const [isJoining, setIsJoining] = useState(false);
  const classCode = useGameStore((s) => s.classCode);
  const gameMode = useGameStore((s) => s.gameMode);
  const setSessionId = useGameStore((s) => s.setSessionId);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNameNext = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNameError(null);
    setStudentName(trimmed);

    // If joining a class, create the session immediately so the teacher
    // sees them on the live dashboard (Quizizz/Kahoot style lobby effect).
    if (classCode) {
      setIsJoining(true);
      const { createStudentSessionInitial, checkStudentNameExists } = await import("@/lib/supabaseClient");

      const exists = await checkStudentNameExists(classCode, trimmed);
      if (exists) {
        setIsJoining(false);
        setNameError("Nama ini sudah ada di kelasmu! Tambahkan nama belakang atau inisial ya.");
        return;
      }

      const result = await createStudentSessionInitial({
        student_name: trimmed,
        class_code: classCode,
        game_mode: gameMode,
      });
      if (result?.id) {
        setSessionId(result.id);
      }
      setIsJoining(false);
    }

    router.push("/game/tutorial");
  };

  return (
    <main
      className="relative h-full w-full flex flex-col items-center overflow-hidden"
      style={{ background: "#50B8A5" }}
    >
      <AnimatePresence mode="wait">

        {/* ── STEP 1: Kode Kelas ── */}
        {step === "code" && (
          <motion.div
            key="code-step"
            className="w-full h-full flex flex-col p-4"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div
              className="flex-1 flex flex-col rounded-[28px] p-6"
              style={{ background: "white", border: "2.5px solid #3DADA0" }}
            >
              <div className="flex-1" />
              <h1 className="font-display font-extrabold text-[28px] leading-tight mb-3 text-center" style={{ color: "#1A2A5E" }}>
                Masukkan Kode<br />Kelasmu!
              </h1>
              <p className="font-body text-sm leading-relaxed text-center" style={{ color: "#6B7A99" }}>
                Minta kode kelas dari gurumu, lalu ketik<br />di bawah ini. Bila tidak ada, klik Lewati!
              </p>

              {/* Text field */}
              <div className="relative">
                <Image src="/assets/textfield.png" alt="" width={300} height={120} className="w-full object-contain" style={{ height: 120 }} />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="contoh: KELAS2A"
                  maxLength={12}
                  className="absolute inset-0 w-full h-full bg-transparent font-body font-semibold text-base tracking-widest px-10 outline-none"
                  style={{ color: "#1A2A5E" }}
                />
              </div>

              {codeError && <p className="font-body text-xs text-red-500 mb-3 leading-snug">{codeError}</p>}

              {/* Lanjut button */}
              <button
                id="btn-code-lanjut"
                onClick={handleCodeNext}
                disabled={isLoading}
                className="relative w-full select-none active:translate-y-1 transition-transform"
              >
                <Image src="/assets/primary_big_button.png" alt="Lanjut" width={400} height={68} className="w-full object-fill" style={{ height: 60 }} />
                <span className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-xl" style={{ color: "#1A2A5E" }}>
                  {isLoading ? "Memeriksa..." : "Lanjut"}
                </span>
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Tito thinking + Lewati */}
              <div className="flex flex-col items-center">
                <Image src="/assets/titothink.png" alt="Tito berpikir" width={110} height={110} className="object-contain mb-[-4px]" />
                <button
                  id="btn-lewati"
                  onClick={handleSkip}
                  className="relative w-full select-none active:translate-y-1 transition-transform"
                >
                  <Image src="/assets/primary_big_button.png" alt="Lewati" width={400} height={68} className="w-full object-fill" style={{ height: 60, filter: "hue-rotate(280deg) saturate(1.8) brightness(0.85)" }} />
                  <span className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-xl text-white">
                    Lewati
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Nama Siswa ── */}
        {step === "name" && (
          <motion.div
            key="name-step"
            className="w-full h-full flex flex-col p-4"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div
              className="flex-1 flex flex-col rounded-[28px] p-6"
              style={{ background: "white", border: "2.5px solid #3DADA0" }}
            >
              <div className="flex-1" />

              <h1 className="font-display font-extrabold text-[28px] leading-tight text-center" style={{ color: "#1A2A5E" }}>
                Yuk Kenalan!<br />Siapa namamu?
              </h1>

              {/* Name text field */}
              <div className="relative mb-2">
                <Image src="/assets/textfield.png" alt="" width={300} height={120} className="w-full object-contain" style={{ height: 120 }} />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nama Lengkap"
                  maxLength={40}
                  className="absolute inset-0 w-full h-full bg-transparent font-body font-semibold text-base px-10 outline-none"
                  style={{ color: "#1A2A5E" }}
                />
              </div>

              {nameError && <p className="font-body text-xs text-red-500 mb-3 leading-snug">{nameError}</p>}

              {/* Lanjut button */}
              <button
                id="btn-name-lanjut"
                onClick={handleNameNext}
                disabled={!nameInput.trim() || isJoining}
                className="relative w-full select-none active:translate-y-1 transition-transform disabled:opacity-60"
              >
                <Image src="/assets/primary_big_button.png" alt="Lanjut" width={400} height={68} className="w-full object-fill" style={{ height: 60 }} />
                <span className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-xl" style={{ color: "#1A2A5E" }}>
                  {isJoining ? "Menyiapkan..." : "Lanjut"}
                </span>
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Celebrating mascots */}
              <div className="w-full flex justify-center pointer-events-none">
                <Image src="/assets/greeting.gif" alt=" Tito dan Tita merayakan" width={860} height={500} className="object-contain" />
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
