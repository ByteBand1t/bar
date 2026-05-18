"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PinLoginFormProps {
  role: "bar" | "admin";
  defaultNext: string;
  title: string;
  subtitle?: string;
}

export function PinLoginForm({ role, defaultNext, title, subtitle }: PinLoginFormProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, role }),
      });

      if (res.ok) {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next") ?? defaultNext;
        router.push(next);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "PIN falsch");
        setPin("");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a1e] p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#1a1030] border border-purple-800/40 rounded-2xl p-8 shadow-2xl shadow-purple-900/20">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-purple-400 mb-6">{subtitle}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-purple-300 mb-2">
                PIN
              </label>
              <input
                ref={inputRef}
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••"
                className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 bg-black/40 border border-purple-700/50 rounded-xl text-white placeholder-purple-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length === 0}
              className="w-full py-3 px-6 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/30 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Anmelden…
                </>
              ) : (
                "Anmelden"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
