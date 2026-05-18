"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/bar/login");
      router.refresh();
    } catch {
      toast.error("Abmelden fehlgeschlagen");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-800/30 transition-colors"
      title="Abmelden"
    >
      <LogOut size={18} />
    </button>
  );
}
