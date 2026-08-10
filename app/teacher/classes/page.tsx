"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, CalendarDays, X, Copy, Check } from "lucide-react";
import type { ClassRow } from "@/lib/types";

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newFrom, setNewFrom] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [newUntil, setNewUntil] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/teacher/login"); return; }
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", session.user.id)
      .order("created_at", { ascending: false });
    setClasses((data as ClassRow[]) ?? []);
    setIsLoading(false);
  }, [router]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const code = newCode.trim().toUpperCase();
    if (!code || !newName.trim()) { setFormError("Nama kelas dan kode wajib diisi."); return; }
    if (!/^[A-Z0-9]+$/.test(code)) { setFormError("Kode hanya boleh huruf kapital dan angka."); return; }
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("classes").insert({
      class_name: newName.trim(),
      class_code: code,
      teacher_id: session.user.id,
      active_from: new Date(newFrom).toISOString(),
      active_until: newUntil ? new Date(newUntil).toISOString() : null,
    } as never);
    setIsSaving(false);
    if (error) { setFormError(error.message); return; }
    setShowModal(false);
    setNewName(""); setNewCode(""); setNewUntil("");
    fetchClasses();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isActive = (cls: ClassRow) => {
    const now = new Date();
    const from = new Date(cls.active_from);
    const until = cls.active_until ? new Date(cls.active_until) : null;
    return from <= now && (!until || until >= now);
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl" style={{ color: "#1A2A5E" }}>Kelas Saya</h1>
          <p className="font-body text-sm" style={{ color: "#6B7A99" }}>Kelola kode kelas dan pantau aktivitas siswa</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 font-display font-bold text-sm"
          style={{ background: "#C6F516", color: "#1A2A5E", boxShadow: "0 4px 0 #8CBE11" }}>
          <Plus className="w-4 h-4" /> Buat Kelas
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="font-body text-sm animate-pulse" style={{ color: "#6B7A99" }}>Memuat kelas...</div>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border-2 border-dashed" style={{ borderColor: "#D1F0EB" }}>
          <span className="text-4xl">🏫</span>
          <p className="font-display font-bold" style={{ color: "#1A2A5E" }}>Belum ada kelas</p>
          <p className="font-body text-sm" style={{ color: "#6B7A99" }}>Buat kelas pertamamu untuk mulai memantau siswa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <div key={cls.id}
              className="bg-white rounded-2xl p-5 border flex flex-col gap-3 cursor-pointer hover:shadow-md transition"
              style={{ borderColor: "#D1F0EB" }}
              onClick={() => router.push(`/teacher/classes/${cls.class_code}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color: "#1A2A5E" }}>{cls.class_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body font-bold text-sm tracking-widest px-2 py-0.5 rounded-lg" style={{ background: "#E8F5F3", color: "#50B8A5" }}>
                      {cls.class_code}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); copyCode(cls.class_code); }}
                      className="p-1 rounded" style={{ color: "#6B7A99" }}>
                      {copiedCode === cls.class_code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full ${isActive(cls) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {isActive(cls) ? "Aktif" : "Tidak Aktif"}
                </span>
              </div>
              <div className="flex items-center gap-1 font-body text-xs" style={{ color: "#6B7A99" }}>
                <CalendarDays className="w-3.5 h-3.5" />
                Aktif: {formatDateTime(cls.active_from)}
                {cls.active_until && ` – ${formatDateTime(cls.active_until)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4" style={{ border: "2px solid #D1F0EB" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl" style={{ color: "#1A2A5E" }}>Buat Kelas Baru</h2>
              <button onClick={() => setShowModal(false)} style={{ color: "#6B7A99" }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-sm font-semibold" style={{ color: "#1A2A5E" }}>Nama Kelas</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="contoh: Kelas 8A SMPN 5" required
                  className="w-full rounded-xl px-4 py-2.5 font-body text-sm border-2 outline-none"
                  style={{ borderColor: "#D1F0EB", color: "#1A2A5E" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-sm font-semibold" style={{ color: "#1A2A5E" }}>Kode Kelas</label>
                <input type="text" value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="contoh: KELAS8A" required maxLength={12}
                  className="w-full rounded-xl px-4 py-2.5 font-body text-sm font-bold tracking-widest border-2 outline-none"
                  style={{ borderColor: "#D1F0EB", color: "#50B8A5" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-sm font-semibold" style={{ color: "#1A2A5E" }}>Aktif Dari</label>
                  <input type="datetime-local" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} required
                    className="w-full rounded-xl px-3 py-2.5 font-body text-xs border-2 outline-none"
                    style={{ borderColor: "#D1F0EB", color: "#1A2A5E" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-sm font-semibold" style={{ color: "#1A2A5E" }}>Berakhir <span className="font-normal text-xs">(opsional)</span></label>
                  <input type="datetime-local" value={newUntil} onChange={(e) => setNewUntil(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 font-body text-xs border-2 outline-none"
                    style={{ borderColor: "#D1F0EB", color: "#1A2A5E" }} />
                </div>
              </div>
              {formError && <p className="font-body text-xs text-red-500">{formError}</p>}
              <button type="submit" disabled={isSaving}
                className="w-full rounded-2xl py-3 font-display font-bold text-base disabled:opacity-60"
                style={{ background: "#C6F516", color: "#1A2A5E", boxShadow: "0 4px 0 #8CBE11" }}>
                {isSaving ? "Menyimpan..." : "Buat Kelas"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
