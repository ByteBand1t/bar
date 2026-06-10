"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, ChevronLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-admin-bg text-admin-ink">
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
    <header className="sticky top-0 z-30 bg-admin-surface/90 border-b border-admin-border px-4 py-3 shadow-sm backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <Settings size={20} className="text-accent" />
        <span className="font-bold text-lg text-admin-ink">Admin</span>

        <nav className="flex items-center gap-2 ml-2">
          <Link
            href="/admin"
            className="text-sm font-medium text-admin-muted hover:text-accent transition-colors"
          >
            Cocktails
          </Link>
          <Link
            href="/admin/export"
            className="text-sm font-medium text-admin-muted hover:text-accent transition-colors"
          >
            Export
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/bar"
            className="flex items-center gap-1.5 text-sm text-admin-muted hover:text-accent transition-colors"
          >
            <ChevronLeft size={16} />
            Zur Bar
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-sm text-admin-muted hover:text-red-600 transition-colors"
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
