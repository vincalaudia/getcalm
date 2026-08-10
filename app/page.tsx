import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GetCalmerLandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-body selection:bg-purple-200 selection:text-purple-900 overflow-x-hidden relative">

      {/* --- Rainbow Background Arcs (CSS) --- */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[120%] h-[120%] rounded-[100%] border-[60px] border-pink-200/40 opacity-70" />
        <div className="absolute -top-[15%] -right-[5%] w-[110%] h-[110%] rounded-[100%] border-[60px] border-purple-200/40 opacity-70" />
        <div className="absolute -top-[10%] right-[0%] w-[100%] h-[100%] rounded-[100%] border-[60px] border-orange-100/50 opacity-70" />
        <div className="absolute -top-[5%] right-[5%] w-[90%] h-[90%] rounded-[100%] border-[60px] border-blue-100/50 opacity-70" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 pt-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between bg-transparent">
          <Image
            src="/assets/logo_get_calmer.png"
            alt="Get Calmer"
            width={160}
            height={60}
            className="object-contain drop-shadow-md"
          />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#about" className="hover:text-purple-600 transition">Tentang Kami</a>
            <a href="#features" className="hover:text-purple-600 transition">Fitur</a>
            <a href="/teacher/login" className="hover:text-purple-600 transition">Portal Guru</a>
            <Link
              href="/game"
              className="px-6 py-2.5 bg-[#8B5CF6] text-white rounded-full font-display hover:bg-[#7C3AED] transition shadow-lg shadow-purple-500/30"
            >
              Mainkan Simulasi
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center text-center z-10">

        {/* Floating Mascots */}
        <div className="absolute right-10 xl:right-24 top-64 xl:top-56 hidden lg:block animate-[bounce_4s_infinite_reverse]">
          <Image src="/assets/tito_base.png" alt="Tito" width={160} height={160} className="drop-shadow-2xl object-contain" />
        </div>

        <div className="absolute left-10 xl:left-24 top-64 xl:top-56 hidden lg:block animate-[bounce_4s_infinite]">
          <Image src="/assets/tita_base.png" alt="Tita" width={200} height={180} className="drop-shadow-2xl object-contain" />
        </div>


        <div className="bg-[#D1F0EB] text-[#0F766E] px-5 py-1.5 rounded-full font-bold text-sm mb-6 inline-flex shadow-sm">
          Platform Edukasi Literasi Digital
        </div>

        <h1 className="font-display font-black text-5xl md:text-[64px] leading-[1.1] text-[#1E293B] max-w-3xl mb-6">
          Bekali Pemuda Hadapi Era Informasi Digital
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed mb-10 font-medium">
          GetCalmer adalah simulasi interaktif yang dirancang untuk melatih kemampuan siswa dalam membedakan berita asli, misinformasi, dan konten buatan AI (Hoaks AI).
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            href="/game"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#34D399] text-white font-display font-extrabold text-xl rounded-2xl transition-transform active:scale-95 shadow-[0_6px_0_#059669] hover:shadow-[0_4px_0_#059669] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px]"
          >
            Mulai Bermain 🚀
          </Link>
          <Link
            href="/teacher/login"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F472B6] text-white font-display font-extrabold text-xl rounded-2xl transition-transform active:scale-95 shadow-[0_6px_0_#DB2777] hover:shadow-[0_4px_0_#DB2777] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px]"
          >
            Dasbor Guru 👩‍🏫
          </Link>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="py-16 px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-white rounded-[40px] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row items-center gap-10">
          <div className="hidden md:block text-[120px] drop-shadow-xl animate-[pulse_6s_infinite]">
            ⭐
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#1E293B] mb-4">
              Mengapa GetCalmer?
            </h2>
            <p className="text-slate-600 leading-relaxed md:text-lg">
              Dalam era digital saat ini, arus informasi bergerak sangat cepat. Seringkali, misinformasi dan konten palsu yang dibuat oleh AI menyebar lebih cepat daripada kebenaran. Kami percaya bahwa pencegahan terbaik adalah dengan edukasi. GetCalmer menghadirkan simulasi realistis yang meniru antarmuka media sosial populer, melatih siswa untuk berpikir kritis sebelum menekan tombol Like atau Share.
            </p>
          </div>
          <div className="hidden md:block text-[120px] drop-shadow-xl">
            🪴
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="flex gap-2 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="w-2 h-2 rounded-full bg-orange-400 opacity-70" />
              <span className="w-2 h-2 rounded-full bg-orange-400 opacity-40" />
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#1E293B]">
              Fitur Utama
            </h2>
            <div className="flex gap-2 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-400 opacity-40" />
              <span className="w-2 h-2 rounded-full bg-orange-400 opacity-70" />
              <span className="w-2 h-2 rounded-full bg-orange-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[32px] text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-5xl drop-shadow-md">
                🧐
              </div>
              <h3 className="font-display font-bold text-xl text-[#059669] mb-3">Berpikir Kritis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Menganalisis konten sebelum berinteraksi.</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 text-5xl drop-shadow-md relative">
                🤖
                <div className="absolute -bottom-2 -right-2 bg-[#34D399] text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
                  AI
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-[#DB2777] mb-3">Deteksi AI</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Mengenali pola manipulasi gambar dan video AI.</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 text-5xl drop-shadow-md">
                🛡️
              </div>
              <h3 className="font-display font-bold text-xl text-[#D97706] mb-3">Ketahanan Hoaks</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Mengetahui cara melaporkan informasi palsu.</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-5xl drop-shadow-md">
                📊
              </div>
              <h3 className="font-display font-bold text-xl text-[#4F46E5] mb-3">Analisis Guru</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Laporan komprehensif metrik siswa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Banners Section ── */}
      <section className="py-12 px-6 max-w-5xl mx-auto flex flex-col gap-8 relative z-10">

        {/* Portal Guru Banner */}
        <div className="bg-gradient-to-r from-[#D1F0EB] to-[#E0F2FE] rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-sm border border-white/50">
          <div className="hidden md:block text-7xl drop-shadow-md">📋</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display font-bold text-2xl text-[#0F766E] mb-2">
              Pantau Progres Siswa dengan Portal Guru
            </h2>
            <p className="text-slate-600 mb-6 text-sm md:text-base">
              Dapatkan laporan lengkap, pantau performa siswa secara real-time, dan dapatkan insight untuk mendukung proses belajar yang lebih baik.
            </p>
            <Link
              href="/teacher/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#84CC16] text-white font-bold rounded-xl shadow-[0_4px_0_#4D7C0F] hover:translate-y-[2px] hover:shadow-[0_2px_0_#4D7C0F] active:translate-y-[4px] active:shadow-none transition-all"
            >
              Buka Portal Guru 📊
            </Link>
          </div>
          <div className="hidden md:block text-8xl drop-shadow-xl">👨‍💻</div>
        </div>

        {/* Siap Mencoba Banner */}
        <div className="bg-gradient-to-r from-[#FCE7F3] to-[#FEF2F2] rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm border border-white/50">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-7xl drop-shadow-md animate-[bounce_3s_infinite]">👾</div>
            <div className="text-3xl drop-shadow-sm opacity-80">🩷</div>
          </div>
          <div className="flex-1 text-center">
            <h2 className="font-display font-bold text-2xl text-[#BE185D] mb-2">
              Siap Mencoba Simulasinya?
            </h2>
            <p className="text-slate-600 mb-6 md:mb-0 text-sm md:text-base">
              Masuk ke dunia GetCalmer dan uji kemampuanmu membedakan konten asli, hoaks, dan AI!
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F472B6] text-white font-bold text-lg rounded-2xl shadow-[0_5px_0_#BE185D] hover:translate-y-[2px] hover:shadow-[0_3px_0_#BE185D] active:translate-y-[5px] active:shadow-none transition-all"
            >
              Mainkan Simulasi 🎮
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative mt-20 pb-8 pt-32 px-6 text-center">
        {/* Purple wavy background (CSS) */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-[#E0E7FF] rounded-t-[100%] -z-10 opacity-60" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-[#C7D2FE] rounded-t-[100%] -z-10 opacity-40" />

        <p className="text-slate-500 font-body text-sm font-medium">
          © {new Date().getFullYear()} GetCalmer. Edukasi Literasi Digital Indonesia.
        </p>
      </footer>
    </main>
  );
}
