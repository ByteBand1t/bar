"use client";

import { useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { addToast } from "@/components/ui/toast";
import type { BarStateValue } from "@/hooks/use-bar-stream";

const QUICK_MESSAGES = [
  "Kurze Pause – gleich geht's weiter!",
  "Tortenanschnitt – 5 Min",
  "Wir kommen gleich wieder",
];

const AUTO_RESUME = [
  { label: "Kein Auto-Resume", min: 0 },
  { label: "5 Min", min: 5 },
  { label: "10 Min", min: 10 },
  { label: "15 Min", min: 15 },
  { label: "30 Min", min: 30 },
];

function sinceLabel(pauseUntil: string | null): string {
  if (!pauseUntil) return "";
  const d = new Date(pauseUntil);
  if (Number.isNaN(d.getTime())) return "";
  return ` – bis ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
}

export function PauseControl({ barState }: { barState: BarStateValue }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resumeMin, setResumeMin] = useState(0);
  const [busy, setBusy] = useState(false);

  const accepting = barState.acceptingOrders;

  const pause = async () => {
    setBusy(true);
    try {
      const until =
        resumeMin > 0
          ? new Date(Date.now() + resumeMin * 60_000).toISOString()
          : null;
      const res = await fetch("/api/bar/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined, until }),
      });
      if (!res.ok) throw new Error();
      addToast("Bestellannahme pausiert", "success");
      setOpen(false);
    } catch {
      addToast("Pausieren fehlgeschlagen", "error");
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/bar/resume", { method: "POST" });
      if (!res.ok) throw new Error();
      addToast("Bestellannahme läuft wieder", "success");
      setOpen(false);
    } catch {
      addToast("Fortsetzen fehlgeschlagen", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
          accepting
            ? "bg-emerald-900/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60"
            : "bg-red-900/60 border-red-600 text-red-200 hover:bg-red-900/80"
        }`}
        title="Bestellannahme steuern"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            accepting ? "bg-emerald-400 animate-pulse" : "bg-red-400"
          }`}
        />
        {accepting ? "Aktiv" : `Pausiert${sinceLabel(barState.pauseUntil)}`}
      </button>

      <SheetContent open={open} onClose={() => setOpen(false)}>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-300">
              Bestellannahme
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-800/40"
            >
              <X size={18} />
            </button>
          </div>

          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              accepting
                ? "bg-emerald-900/40 text-emerald-300"
                : "bg-red-900/50 text-red-200"
            }`}
          >
            Status: {accepting ? "Aktiv – Gäste können bestellen" : "Pausiert"}
            {!accepting && barState.pauseMessage && (
              <p className="mt-1 text-red-300 font-normal">
                „{barState.pauseMessage}“
              </p>
            )}
          </div>

          {accepting ? (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">
                  Pause-Nachricht (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Was sollen die Gäste sehen?"
                  className="w-full bg-[#1a1030] border border-purple-700 rounded-xl px-3 py-2 text-sm text-purple-100 placeholder:text-purple-600 focus:outline-none focus:border-amber-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_MESSAGES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMessage(m)}
                      className="text-xs px-2 py-1 rounded-full bg-purple-800/50 text-purple-300 hover:bg-purple-700/60"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">
                  Automatisch fortsetzen
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AUTO_RESUME.map((r) => (
                    <button
                      key={r.min}
                      onClick={() => setResumeMin(r.min)}
                      className={`text-xs px-3 py-1.5 rounded-full border ${
                        resumeMin === r.min
                          ? "bg-amber-500 text-slate-900 border-amber-500"
                          : "bg-purple-800/40 text-purple-300 border-purple-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={pause}
                disabled={busy}
              >
                <Pause size={18} /> Bestellannahme pausieren
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={resume} disabled={busy}>
              <Play size={18} /> Bestellannahme fortsetzen
            </Button>
          )}
        </div>
      </SheetContent>
    </>
  );
}
