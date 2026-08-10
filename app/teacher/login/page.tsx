"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, LogIn, UserPlus, Mail, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      setIsLoading(false);

      if (error) {
        console.error("[ThinkTok Auth Error]", error);
        if (error.message.includes("Invalid login credentials")) {
          setError("Email atau password salah. Pastikan akun sudah terdaftar dan password benar.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Email Anda belum dikonfirmasi. Cek kotak masuk (inbox/spam) email Anda untuk melakukan verifikasi.");
        } else {
          setError(`Gagal masuk: ${error.message}`);
        }
      } else if (data.session) {
        setSuccessMsg("Berhasil masuk! Membuka halaman kelas...");
        setTimeout(() => {
          window.location.href = "/teacher/classes";
        }, 500);
      } else {
        setError("Akun belum diverifikasi atau sesi tidak valid. Silakan cek email Anda.");
      }
    } else {
      // Sign Up Mode
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      setIsLoading(false);

      if (error) {
        console.error("[ThinkTok Sign Up Error]", error);
        if (error.message.includes("User already registered")) {
          setError("Email ini sudah terdaftar. Silakan pilih tab 'Masuk' di atas.");
        } else if (error.message.includes("Password should be at least")) {
          setError("Password terlalu pendek. Gunakan minimal 6 karakter.");
        } else {
          setError(`Gagal mendaftar: ${error.message}`);
        }
      } else {
        if (data.session) {
          // Logged in immediately
          setSuccessMsg("Akun berhasil dibuat dan Anda telah masuk!");
          setTimeout(() => {
            window.location.href = "/teacher/classes";
          }, 800);
        } else {
          // Confirmation required
          setSuccessMsg("Akun berhasil dibuat! Silakan cek email Anda untuk melakukan verifikasi, lalu masuk.");
          setMode("login");
        }
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative" style={{ background: "#F0FAF8" }}>
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border p-8 flex flex-col items-center gap-6"
        style={{ borderColor: "#D1F0EB" }}
      >

        {/* Brand */}

        <Link
          href="/"
          className="self-start flex items-center gap-2 font-body text-xs font-semibold underline"
          style={{ color: "#1A2A5E" }}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>


        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-3xl" style={{ color: "#1A2A5E" }}>
              GetCalmer
            </span>
            <span className="font-body text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: "#C6F516", color: "#1A2A5E" }}>
              PORTAL GURU
            </span>
          </div>
          <p className="font-body text-sm text-center" style={{ color: "#6B7A99" }}>
            Dasbor guru untuk memantau hasil siswa
          </p>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-semibold" style={{ color: "#1A2A5E" }}>
              Email Guru
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              required
              className="w-full rounded-xl px-4 py-3 font-body text-sm border-2 outline-none transition focus:border-teal-400"
              style={{ borderColor: "#D1F0EB", color: "#1A2A5E", background: "#F8FFFE" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-semibold" style={{ color: "#1A2A5E" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="w-full rounded-xl px-4 py-3 pr-12 font-body text-sm border-2 outline-none transition focus:border-teal-400"
                style={{ borderColor: "#D1F0EB", color: "#1A2A5E", background: "#F8FFFE" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 font-body text-xs flex items-start gap-2.5" style={{ background: "#FFF0F0", color: "#CC2222", border: "1px solid #FFCCCC" }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-2xl px-4 py-3 font-body text-xs flex items-center gap-2.5" style={{ background: "#F0FFF4", color: "#15803D", border: "1px solid #BBF7D0" }}>
              {successMsg.includes("Membuka") || successMsg.includes("masuk!") ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-green-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              )}
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-display font-bold text-base transition disabled:opacity-60 mt-2"
            style={{
              background: "#C6F516",
              color: "#1A2A5E",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.6), 0 5px 0 #8CBE11",
            }}
          >
            {mode === "login" ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLoading
              ? mode === "login"
                ? "Memeriksa..."
                : "Mendaftar..."
              : mode === "login"
                ? "Masuk Dashboard"
                : "Daftar Akun Guru"}
          </button>
        </form>

        {/* Support contact link */}
        <div className="w-full pt-4 border-t flex flex-col items-center gap-2" style={{ borderColor: "#E8F5F3" }}>
          <p className="font-body text-xs text-center" style={{ color: "#6B7A99" }}>
            Belum punya akun? Pendaftaran guru saat ini hanya bisa dilakukan melalui Admin.
          </p>
          <a
            href="mailto:jovinca.amarissa@gmail.com?subject=Permintaan Akun Guru GetCalmer"
            className="flex items-center gap-2 font-body text-xs font-semibold px-4 py-2 rounded-xl transition"
            style={{ color: "#1A2A5E", background: "#E8F5F3" }}
          >
            <Mail className="w-4 h-4" /> Hubungi Admin GetCalmer
          </a>
        </div>

      </div>
    </main>
  );
}
