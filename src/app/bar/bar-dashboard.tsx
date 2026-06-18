"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Volume2, VolumeX, History, RefreshCw, Settings, BarChart3, Wine } from "lucide-react";
import { useBarStream } from "@/hooks/use-bar-stream";
import { OrderCard } from "@/components/bar/order-card";
import { HistoryDrawer } from "@/components/bar/history-drawer";
import { PauseControl } from "@/components/bar/pause-control";
import { AvailabilityDrawer } from "@/components/bar/availability-drawer";
import { SoundInitBanner } from "@/components/bar/sound-init-banner";
import { PushToggle } from "@/components/bar/push-toggle";
import { Toaster } from "@/components/ui/toast";
import {
  isSoundEnabled,
  setSoundEnabled,
  getVolume,
  setVolume,
} from "@/lib/sound";
import type { OrderWithDetails } from "@/lib/event-bus";
import { LogoutButton } from "@/components/bar/logout-button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const STATUS_LABELS: Record<string, string> = {
  new: "NEU",
  in_progress: "IN ARBEIT",
  ready: "FERTIG ZUR ABHOLUNG",
};

const COLUMN_STYLES: Record<string, string> = {
  new: "bg-amber-500/10 border-amber-400/20 shadow-inner shadow-amber-950/20",
  in_progress: "bg-blue-500/10 border-blue-400/20 shadow-inner shadow-blue-950/20",
  ready: "bg-emerald-500/10 border-emerald-400/20 shadow-inner shadow-emerald-950/20",
};

const COLUMN_HEADER_STYLES: Record<string, string> = {
  new: "text-amber-400",
  in_progress: "text-blue-400",
  ready: "text-emerald-400",
};

function ConnectionLed({ state }: { state: "connecting" | "connected" | "disconnected" }) {
  const color =
    state === "connected"
      ? "bg-emerald-400 shadow-emerald-400/50"
      : state === "connecting"
        ? "bg-yellow-400 shadow-yellow-400/50"
        : "bg-red-500 shadow-red-500/50";

  const label =
    state === "connected"
      ? "Verbunden"
      : state === "connecting"
        ? "Verbinde..."
        : "Verbindung getrennt";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${color} ${state === "connecting" ? "animate-pulse" : ""}`} />
          <span className="text-xs text-bar-muted hidden sm:inline">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function StatsStrip({ orders }: { orders: OrderWithDetails[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = orders.filter((o) =>
    ["new", "in_progress", "ready"].includes(o.status)
  ).length;

  const avgWait = useMemo(() => {
    const active = orders.filter((o) => ["new", "in_progress"].includes(o.status));
    if (!active.length) return null;
    const totalMs = active.reduce(
      (sum, o) => sum + (now - new Date(o.createdAt).getTime()),
      0
    );
    const avgSec = Math.floor(totalMs / active.length / 1000);
    const m = Math.floor(avgSec / 60);
    const s = avgSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [orders, now]);

  return (
    <div className="hidden lg:flex items-center gap-4 text-sm text-bar-muted">
      <span>
        Aktiv: <span className="text-white font-medium">{activeCount}</span>
      </span>
      {avgWait && (
        <span>
          Ø Wartezeit: <span className="text-white font-medium">{avgWait}</span>
        </span>
      )}
    </div>
  );
}

function LastActivity({ lastEventAt }: { lastEventAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.floor((now - lastEventAt) / 1000);
  if (sec < 5) return null;
  return (
    <span className="hidden lg:inline text-xs text-bar-muted/70">
      Letzte Aktivität vor {sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m`}
    </span>
  );
}

export function BarDashboard() {
  const {
    orders,
    connectionState,
    barState,
    lastEventAt,
    updateOrderOptimistic,
    removeOrder,
  } = useBarStream();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    if (typeof window === "undefined") return true;
    return isSoundEnabled();
  });
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 0.7;
    return getVolume();
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newIds = new Set<string>();
    orders.forEach((o) => {
      if (!prevOrderIdsRef.current.has(o.id)) {
        newIds.add(o.id);
      }
    });
    if (newIds.size > 0) {
      setNewOrderIds((prev) => new Set([...prev, ...newIds]));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 1200);
    }
    prevOrderIdsRef.current = new Set(orders.map((o) => o.id));
  }, [orders]);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {}
    };
    acquire();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolumeState(v);
    setVolume(v);
  };

  const handleStatusChange = async (
    id: string,
    status: string,
    optimisticFn: () => void,
    rollbackFn: () => void
  ) => {
    const prev = orders.find((o) => o.id === id);
    if (!prev) return;

    updateOrderOptimistic(id, { status: status as OrderWithDetails["status"] });
    if (status === "completed") removeOrder(id);
    optimisticFn();

    const res = await fetch(`/api/bar/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      if (status === "completed") {
        // Can't easily re-add, SSE will resync
      } else {
        updateOrderOptimistic(id, { status: prev.status });
      }
      rollbackFn();
    }
  };

  const handleCancel = async (
    id: string,
    reason: string,
    optimisticFn: () => void,
    rollbackFn: () => void
  ) => {
    const prev = orders.find((o) => o.id === id);
    if (!prev) return;

    optimisticFn();

    const res = await fetch(`/api/bar/orders/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (res.ok) {
      removeOrder(id);
    } else {
      rollbackFn();
    }
  };

  const handleReopen = () => {
    // SSE will push the reopened order into active list automatically
  };

  const columns: Array<{ status: string; orders: OrderWithDetails[] }> = [
    {
      status: "new",
      orders: orders
        .filter((o) => o.status === "new")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    },
    {
      status: "in_progress",
      orders: orders
        .filter((o) => o.status === "in_progress")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    },
    {
      status: "ready",
      orders: orders
        .filter((o) => o.status === "ready")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden select-none bg-bar-bg text-bar-ink">
        <SoundInitBanner />

        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-bar-bg/95 border-b border-bar-border shadow-lg shadow-black/20 backdrop-blur shrink-0 gap-4">
          <h1 className="text-lg font-bold text-bar-ink shrink-0">Bar – Live-Bestellungen</h1>

          <StatsStrip orders={orders} />

          <div className="flex items-center gap-3 ml-auto">
            <LastActivity lastEventAt={lastEventAt} />
            <PushToggle />
            <PauseControl barState={barState} />
            <ConnectionLed state={connectionState} />

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg text-bar-muted hover:text-white hover:bg-bar-soft transition-colors"
                title={soundEnabled ? "Sound aus" : "Sound an"}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              {soundEnabled && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolume}
                  className="w-20 accent-amber-400"
                  title={`Lautstärke: ${Math.round(volume * 100)}%`}
                />
              )}
            </div>

            <button
              onClick={() => setAvailabilityOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-bar-muted hover:text-white hover:bg-bar-soft transition-colors border border-bar-border"
            >
              <Wine size={16} />
              <span className="hidden sm:inline">Verfügbarkeit</span>
            </button>

            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-bar-muted hover:text-white hover:bg-bar-soft transition-colors border border-bar-border"
            >
              <History size={16} />
              <span className="hidden sm:inline">Verlauf</span>
            </button>

            <a
              href="/bar/stats"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-bar-muted hover:text-white hover:bg-bar-soft transition-colors border border-bar-border"
              title="Statistik"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Statistik</span>
            </a>

            <a
              href="/admin"
              className="p-1.5 rounded-lg text-bar-muted hover:text-white hover:bg-bar-soft transition-colors"
              title="Admin"
            >
              <Settings size={18} />
            </a>

            <LogoutButton />
          </div>
        </header>

        {/* Reconnecting banner */}
        {connectionState === "disconnected" && (
          <div className="bg-red-900/60 border-b border-red-700 px-4 py-2 text-sm text-red-200 flex items-center gap-2 shrink-0">
            <RefreshCw size={14} className="animate-spin" />
            Verbindung getrennt – versuche Wiederverbindung...
          </div>
        )}

        {/* Kanban Columns */}
        <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden min-h-0">
          {columns.map(({ status, orders: colOrders }) => (
            <div
              key={status}
              className={`flex flex-col rounded-xl border ${COLUMN_STYLES[status]} overflow-hidden`}
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 border-b border-white/5 shrink-0 flex items-center gap-2">
                <span className={`font-bold text-sm tracking-wide ${COLUMN_HEADER_STYLES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="ml-auto bg-bar-bg/70 text-xs font-mono text-bar-muted rounded-full px-2 py-0.5">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colOrders.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-bar-muted/50 text-sm">
                    Keine Bestellungen
                  </div>
                )}
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isNew={newOrderIds.has(order.id)}
                    onStatusChange={handleStatusChange}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onReopen={handleReopen}
        />
        <AvailabilityDrawer
          open={availabilityOpen}
          onClose={() => setAvailabilityOpen(false)}
        />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
