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

  const isAdmin = role === "admin";
  const pageClass = isAdmin
    ? "min-h-screen flex items-center justify-center bg-admin-bg p-4 text-admin-ink"
    : "min-h-screen flex items-center justify-center bg-bar-bg p-4 text-bar-ink";
  const cardClass = isAdmin
    ? "bg-admin-surface border border-admin-border rounded-3xl p-8 shadow-xl shadow-slate-200/70"
    : "bg-bar-surface border border-bar-border rounded-3xl p-8 shadow-2xl shadow-black/30";
  const mutedClass = isAdmin ? "text-admin-muted" : "text-bar-muted";
  const inputClass = isAdmin
    ? "w-full text-center text-3xl tracking-[0.5em] px-4 py-4 bg-admin-surface border border-admin-border rounded-2xl text-admin-ink placeholder-admin-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors shadow-sm"
    : "w-full text-center text-3xl tracking-[0.5em] px-4 py-4 bg-bar-bg/80 border border-bar-border rounded-2xl text-bar-ink placeholder-bar-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-colors";

  return (
    <div className={pageClass}>
      <div className="w-full max-w-sm">
        <div className={cardClass}>
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          {subtitle && <p className={`text-sm mb-6 ${mutedClass}`}>{subtitle}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label htmlFor="pin" className={`block text-sm font-medium mb-2 ${mutedClass}`}>
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
                className={inputClass}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length === 0}
              className="w-full py-3 px-6 bg-accent hover:bg-accent-hover disabled:bg-accent/30 disabled:cursor-not-allowed text-accent-fg font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
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
