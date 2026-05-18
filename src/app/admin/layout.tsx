"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, ChevronLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white">
      <AdminHeader />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function AdminHeader() {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Abmelden fehlgeschlagen");
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-[#1a1030] border-b border-purple-800/40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <Settings size={20} className="text-amber-400" />
        <span className="font-bold text-lg text-white">Admin</span>

        <nav className="flex items-center gap-2 ml-2">
          <Link
            href="/admin"
            className="text-sm text-purple-300 hover:text-white transition-colors"
          >
            Cocktails
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/bar"
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            Zur Bar
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-red-400 transition-colors"
            title="Abmelden"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  );
}
