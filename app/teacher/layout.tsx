"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { ReactNode } from "react";
import { LogOut, LayoutDashboard, ChevronRight } from "lucide-react";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/teacher/login");
      } else {
        setEmail(session.user?.email ?? null);
      }
      setIsAuthChecked(true);
    });

    // Also do an initial check just in case the event doesn't fire immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/teacher/login");
      } else {
        setEmail(session.user?.email ?? null);
      }
      setIsAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const isFullscreenPage = pathname?.includes("/login") || pathname?.includes("/live");
  if (isFullscreenPage) return <>{children}</>;

  // Don't render the layout until auth is verified (prevents flash of redirect)
  if (!isAuthChecked) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0FAF8", fontFamily: "'Inter', sans-serif" }}>
      <header className="w-full px-6 py-4 flex items-center justify-between border-b" style={{ background: "white", borderColor: "#D1F0EB" }}>
        <div className="flex items-center gap-2">
          <span className="font-display font-extrabold text-lg" style={{ color: "#1A2A5E" }}>GetCalm</span>
          <span className="font-body text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#C6F516", color: "#1A2A5E" }}>GURU</span>
        </div>
        <div className="flex items-center gap-4">
          {email && <span className="font-body text-xs" style={{ color: "#6B7A99" }}>{email}</span>}
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/teacher/login"); }}
            className="flex items-center gap-1 font-body text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ color: "#1A2A5E", background: "#E8F5F3" }}
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </header>

      {pathname !== "/teacher" && pathname !== "/teacher/classes" && (
        <div className="px-6 py-2 flex items-center gap-1 text-xs" style={{ color: "#6B7A99" }}>
          <button onClick={() => router.push("/teacher/classes")} className="hover:underline flex items-center gap-1">
            <LayoutDashboard className="w-3 h-3" /> Kelas
          </button>
          <ChevronRight className="w-3 h-3" />
          <span>Detail Kelas</span>
        </div>
      )}

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
