"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  GlassWater,
  Clock,
  Activity,
  Timer,
  XCircle,
  Crown,
} from "lucide-react";

const OrdersOverTimeChart = dynamic(
  () => import("./charts").then((m) => m.OrdersOverTimeChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const TopCocktailsChart = dynamic(
  () => import("./charts").then((m) => m.TopCocktailsChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const WaitDistChart = dynamic(
  () => import("./charts").then((m) => m.WaitDistChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="h-[220px] flex items-center justify-center text-purple-600 text-sm">
      Lädt Diagramm…
    </div>
  );
}

interface StatsData {
  overview: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    totalDrinks: number;
    avgWaitTimeSec: number;
    medianWaitTimeSec: number;
    longestWaitSec: number;
    ordersLastHour: number;
  };
  topCocktails: Array<{
    cocktailId: string;
    name: string;
    imageFilename: string | null;
    totalQty: number;
  }>;
  ordersOverTime: Array<{ bucketStart: string; count: number; drinkCount: number }>;
  topGuests: Array<{ guestName: string; orderCount: number; drinkCount: number }>;
  cancels: { totalCancelled: number; byReason: Array<{ reason: string; count: number }> };
  waitDist: Array<{ bucket: string; count: number }>;
  generatedAt: string;
}

const RANGES = [
  { key: "today", label: "Heute" },
  { key: "hour", label: "Letzte Stunde" },
  { key: "15min", label: "Letzten 15 Min" },
  { key: "all", label: "Alle Zeiten" },
];

const BUCKETS = [5, 15, 30, 60];

function fmtDuration(sec: number): string {
  if (!sec) return "–";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="bg-[#1a1030] border border-purple-800/40 rounded-xl p-4 flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 text-xs ${accent ?? "text-purple-400"}`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-amber-200">{value}</div>
    </div>
  );
}

function Tile({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#120d20] border border-purple-800/40 rounded-2xl p-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function StatsDashboard({ initial }: { initial: StatsData }) {
  const [range, setRange] = useState("today");
  const [bucket, setBucket] = useState(15);
  const [data, setData] = useState<StatsData>(initial);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStats = useCallback(
    async (r = range, b = bucket) => {
      try {
        const res = await fetch(`/api/bar/stats?range=${r}&bucket=${b}`);
        if (!res.ok) return;
        const json: StatsData = await res.json();
        setData(json);
        setLastUpdate(new Date());
      } catch {}
    },
    [range, bucket]
  );

  const selectRange = (r: string) => {
    setRange(r);
    fetchStats(r, bucket);
  };
  const selectBucket = (b: number) => {
    setBucket(b);
    fetchStats(range, b);
  };

  // Live: listen to order events on the bar stream, debounce refetch 3s
  useEffect(() => {
    const es = new EventSource("/api/bar/stream");
    const trigger = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchStats, 3000);
    };
    es.addEventListener("order.created", trigger);
    es.addEventListener("order.updated", trigger);
    es.addEventListener("order.completed", trigger);
    es.addEventListener("order.cancelled", trigger);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      es.close();
    };
  }, [fetchStats]);

  const o = data.overview;
  const cancelRate =
    o.totalOrders > 0
      ? Math.round((o.cancelledOrders / o.totalOrders) * 100)
      : 0;

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      <header className="flex items-center gap-3 mb-4 flex-wrap">
        <Link
          href="/bar"
          className="p-2 rounded-full text-purple-300 hover:bg-purple-800/50"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-amber-300">Statistik</h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-purple-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span>
            aktualisiert{" "}
            {lastUpdate.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => selectRange(r.key)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              range === r.key
                ? "bg-amber-500 text-slate-900 border-amber-500"
                : "bg-purple-800/40 text-purple-300 border-purple-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Kpi icon={<ShoppingBag size={14} />} label="Bestellungen" value={o.totalOrders} />
        <Kpi icon={<GlassWater size={14} />} label="Drinks" value={o.totalDrinks} />
        <Kpi icon={<Clock size={14} />} label="Ø Wartezeit" value={fmtDuration(o.avgWaitTimeSec)} />
        <Kpi icon={<Activity size={14} />} label="Aktiv jetzt" value={o.activeOrders} accent="text-emerald-400" />
        <Kpi icon={<Timer size={14} />} label="Letzte Stunde" value={o.ordersLastHour} />
        <Kpi icon={<XCircle size={14} />} label="Storno-Quote" value={`${cancelRate}%`} accent="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tile title="Bestellungen pro Zeit" className="lg:col-span-2">
          <div className="flex gap-1.5 mb-3">
            {BUCKETS.map((b) => (
              <button
                key={b}
                onClick={() => selectBucket(b)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  bucket === b
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-purple-800/40 text-purple-300 border-purple-700"
                }`}
              >
                {b} Min
              </button>
            ))}
          </div>
          {data.ordersOverTime.length === 0 ? (
            <p className="text-sm text-purple-600 py-10 text-center">
              Noch keine Daten
            </p>
          ) : (
            <OrdersOverTimeChart data={data.ordersOverTime} />
          )}
        </Tile>

        <Tile title="Top Cocktails">
          {data.topCocktails.length === 0 ? (
            <p className="text-sm text-purple-600 py-10 text-center">
              Noch keine Daten
            </p>
          ) : (
            <TopCocktailsChart data={data.topCocktails} />
          )}
        </Tile>

        <Tile title="Bestenliste Gäste">
          {data.topGuests.length === 0 ? (
            <p className="text-sm text-purple-600 py-10 text-center">
              Noch keine Daten
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-purple-500 text-xs uppercase">
                  <th className="text-left py-1.5 w-10">#</th>
                  <th className="text-left">Name</th>
                  <th className="text-right">Best.</th>
                  <th className="text-right">Drinks</th>
                </tr>
              </thead>
              <tbody>
                {data.topGuests.map((g, i) => (
                  <tr
                    key={g.guestName + i}
                    className="border-t border-purple-900/40"
                  >
                    <td className="py-1.5">{MEDALS[i] ?? i + 1}</td>
                    <td className="text-amber-200 font-medium">{g.guestName}</td>
                    <td className="text-right text-purple-300">{g.orderCount}</td>
                    <td className="text-right text-white font-semibold">
                      {g.drinkCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tile>

        <Tile title="Wartezeit-Verteilung">
          <WaitDistChart data={data.waitDist} />
        </Tile>

        <Tile title="Stornos">
          {data.cancels.totalCancelled === 0 ? (
            <p className="text-sm text-emerald-400/80 py-6 text-center">
              Bisher keine Stornos – sauber! 🎉
            </p>
          ) : (
            <ul className="space-y-2">
              {data.cancels.byReason.map((r) => (
                <li
                  key={r.reason}
                  className="flex items-center justify-between text-sm border-b border-purple-900/40 pb-1.5"
                >
                  <span className="text-purple-200">{r.reason}</span>
                  <span className="text-red-300 font-mono font-semibold">
                    {r.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>

      <p className="text-center text-xs text-purple-700 mt-6 flex items-center justify-center gap-1">
        <Crown size={12} /> Franzis Geburtstags-Bar
      </p>
    </div>
  );
}
