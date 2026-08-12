"use client";

import { Download, BookOpen, AlertTriangle, Lightbulb, Activity, CheckCircle, Repeat } from "lucide-react";
import { motion } from "framer-motion";

export default function ModulePage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-extrabold text-3xl" style={{ color: "#1A2A5E" }}>Modul Pembelajaran</h1>
        <p className="font-body text-base" style={{ color: "#6B7A99" }}>
          Materi panduan Literasi Digital untuk diajarkan di kelas. Unduh modul lengkap di bawah ini.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6" style={{ borderColor: "#D1F0EB" }}>
        <div className="flex-1 flex flex-col gap-3">
          <h2 className="font-display font-bold text-xl" style={{ color: "#1A2A5E" }}>GetCalmer: Cerdas Bersosial Media</h2>
          <p className="font-body text-sm text-slate-600 leading-relaxed">
            Modul ini berisi materi presentasi 20 halaman yang mengajarkan siswa tentang jebakan media sosial, "The Dopamine Trap", cara mendeteksi AI/Hoax, dan tentunya kerangka berpikir C.A.L.M.E.R.
          </p>
          <a
            href="/assets/modul-calmer.pdf"
            target="_blank"
            rel="noreferrer"
            download
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display font-bold text-sm w-fit transition-transform hover:scale-105"
            style={{ background: "#C6F516", color: "#1A2A5E", boxShadow: "0 4px 0 #8CBE11" }}
          >
            <Download className="w-4 h-4" /> Unduh Modul (PDF)
          </a>
        </div>
        <div className="w-full md:w-1/3 aspect-video bg-[#E8F5F3] rounded-xl flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-[#54C0C7] opacity-50" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-display font-extrabold text-2xl mb-4" style={{ color: "#1A2A5E" }}>Ringkasan C.A.L.M.E.R. Framework</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <motion.div whileHover={{ y: -4 }} className="bg-[#E6F8E8] p-5 rounded-2xl border border-[#4ADE80]">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#4ADE80] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">C</div>
              <h4 className="font-display font-bold text-green-800 text-lg">Check</h4>
            </div>
            <p className="font-body text-sm text-green-900"><strong>Cek Sumber:</strong> Kepoin profil pembuatnya. Kalau akun baru bikin, followers 1, dan tanpa foto asli = Red flag!</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#F3E8FF] p-5 rounded-2xl border border-[#C084FC]">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#C084FC] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">A</div>
              <h4 className="font-display font-bold text-purple-800 text-lg">Absorb</h4>
            </div>
            <p className="font-body text-sm text-purple-900"><strong>Serap Informasinya:</strong> Baca semuanya, jangan cuma judul. Kunci tombol Like/Share sampai kamu selesai membaca!</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#FFEDD5] p-5 rounded-2xl border border-[#FB923C]">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#FB923C] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">L</div>
              <h4 className="font-display font-bold text-orange-800 text-lg">Logic</h4>
            </div>
            <p className="font-body text-sm text-orange-900"><strong>Gunakan Logika:</strong> Waspada dengan kata-kata provokatif dan paksaan untuk "viralkan". Cari bagian yang tidak masuk akal.</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#FFE4E6] p-5 rounded-2xl border border-[#FB7185]">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#FB7185] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">M</div>
              <h4 className="font-display font-bold text-rose-800 text-lg">Manage</h4>
            </div>
            <p className="font-body text-sm text-rose-900"><strong>Kelola Emosimu:</strong> Tarik napas dulu sebelum bereaksi. Jangan terpancing emosi sesaat karena itulah tujuan pembuat hoaks.</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#FEF9C3] p-5 rounded-2xl border border-[#FACC15]">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#FACC15] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">E</div>
              <h4 className="font-display font-bold text-yellow-800 text-lg">Execute</h4>
            </div>
            <p className="font-body text-sm text-yellow-900"><strong>Pilih Langkah Bijak:</strong> Pilih Cek Fakta atau Report daripada buang waktu berdebat di kolom komentar yang merusak mood.</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="bg-[#E0F2FE] p-5 rounded-2xl border border-[#38BDF8]">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#38BDF8] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">R</div>
              <h4 className="font-display font-bold text-sky-800 text-lg">Repeat</h4>
            </div>
            <p className="font-body text-sm text-sky-900"><strong>Jaga Kebiasaan:</strong> Jadikan C.A.L.M.E.R. sebagai refleks setiap kali kamu berhadapan dengan informasi baru di internet.</p>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
