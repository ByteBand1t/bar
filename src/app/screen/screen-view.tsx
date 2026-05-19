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
    <div className="relative min-h-screen overflow-hidden bg-[#0a0715] text-white flex flex-col">
      <div className="screen-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.18),transparent_60%)]" />

      <header className="relative pt-10 pb-4 text-center">
        <h1 className="text-5xl font-bold text-amber-300 tracking-tight">
          🍹 Franzis Geburtstags-Bar
        </h1>
        <p className="mt-3 text-xl text-purple-300">
          <span className="text-amber-200 font-semibold">{data.totalDrinks}</span>{" "}
          Drinks ausgegeben ·{" "}
          <span className="text-amber-200 font-semibold">
            {fmtWait(data.avgWaitTimeSec)}
          </span>{" "}
          Ø Wartezeit · {data.activeOrders} aktiv
        </p>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <h2 className="text-2xl uppercase tracking-widest text-purple-400">
          Bestenliste
        </h2>
        <ol className="w-full max-w-3xl space-y-3">
          {data.topGuests.length === 0 && (
            <li className="text-center text-purple-500 text-2xl py-12">
              Noch keine Bestellungen – sei der/die Erste!
            </li>
          )}
          {data.topGuests.map((g, i) => (
            <li
              key={g.guestName + i}
              className={`flex items-center gap-5 rounded-2xl px-7 py-4 border ${
                i === 0
                  ? "bg-amber-500/15 border-amber-500/50"
                  : i < 3
                    ? "bg-purple-800/20 border-purple-600/40"
                    : "bg-white/[0.03] border-white/10"
              }`}
            >
              <span className="text-4xl w-14 text-center">
                {MEDALS[i] ?? <span className="text-purple-400">{i + 1}</span>}
              </span>
              <span className="flex-1 text-3xl font-semibold text-amber-100">
                {g.guestName}
              </span>
              <span className="text-3xl font-bold text-amber-300">
                {g.drinkCount}
              </span>
            </li>
          ))}
        </ol>
      </main>

      <footer className="relative h-16 border-t border-white/10 flex items-center px-8 overflow-hidden">
        {tick ? (
          <p key={tick} className="ticker-in text-xl text-purple-200">
            <span className="text-amber-300">Frisch serviert:</span> {tick}
          </p>
        ) : (
          <div className="flex gap-8 text-lg text-purple-400">
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
