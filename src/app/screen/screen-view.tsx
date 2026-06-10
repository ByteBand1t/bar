"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ScreenData {
  totalDrinks: number;
  avgWaitTimeSec: number;
  activeOrders: number;
  topGuests: Array<{ guestName: string; drinkCount: number }>;
  recent: Array<{ id: string; guestName: string; drink: string }>;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function fmtWait(sec: number): string {
  if (!sec) return "–";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ScreenView({ initial }: { initial: ScreenData }) {
  const [data, setData] = useState<ScreenData>(initial);
  const [tick, setTick] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/screen");
      if (res.ok) setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/screen/stream");
    es.addEventListener("refresh", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data) as { type: string; guestName: string; drink: string };
        if (d.type === "order.completed") {
          setTick(`${d.guestName} – ${d.drink} 🍹`);
        }
      } catch {}
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(refetch, 2000);
    });
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      es.close();
    };
  }, [refetch]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-bar-bg text-bar-ink flex flex-col">
      <div className="screen-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,82,60,0.18),transparent_60%)]" />

      <header className="relative pt-10 pb-4 text-center">
        <h1 className="text-5xl font-bold text-accent tracking-tight">
          🍹 Franzis Geburtstags-Bar
        </h1>
        <p className="mt-3 text-xl text-bar-muted">
          <span className="text-bar-ink font-semibold">{data.totalDrinks}</span>{" "}
          Drinks ausgegeben ·{" "}
          <span className="text-bar-ink font-semibold">
            {fmtWait(data.avgWaitTimeSec)}
          </span>{" "}
          Ø Wartezeit · {data.activeOrders} aktiv
        </p>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <h2 className="text-2xl uppercase tracking-widest text-bar-muted">
          Bestenliste
        </h2>
        <ol className="w-full max-w-3xl space-y-3">
          {data.topGuests.length === 0 && (
            <li className="text-center text-bar-muted/60 text-2xl py-12">
              Noch keine Bestellungen – sei der/die Erste!
            </li>
          )}
          {data.topGuests.map((g, i) => (
            <li
              key={g.guestName + i}
              className={`flex items-center gap-5 rounded-2xl px-7 py-4 border ${
                i === 0
                  ? "bg-accent/15 border-accent/40 shadow-lg shadow-accent/5"
                  : i < 3
                    ? "bg-bar-surface-2/80 border-bar-border"
                    : "bg-bar-surface/70 border-bar-border"
              }`}
            >
              <span className="text-4xl w-14 text-center">
                {MEDALS[i] ?? <span className="text-bar-muted">{i + 1}</span>}
              </span>
              <span className="flex-1 text-3xl font-semibold text-bar-ink">
                {g.guestName}
              </span>
              <span className="text-3xl font-bold text-accent">
                {g.drinkCount}
              </span>
            </li>
          ))}
        </ol>
      </main>

      <footer className="relative h-16 border-t border-white/10 flex items-center px-8 overflow-hidden">
        {tick ? (
          <p key={tick} className="ticker-in text-xl text-bar-ink">
            <span className="text-accent">Frisch serviert:</span> {tick}
          </p>
        ) : (
          <div className="flex gap-8 text-lg text-bar-muted">
            {data.recent.map((r) => (
              <span key={r.id}>
                {r.guestName} · {r.drink}
              </span>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
