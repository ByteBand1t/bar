"use client";

import { useEffect, useRef, useState } from "react";
import { PauseCircle, CheckCircle2 } from "lucide-react";
import { useLiveStore, type BarState } from "@/store/live";

function formatUntil(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function GuestLive() {
  const setBarState = useLiveStore((s) => s.setBarState);
  const setAvailability = useLiveStore((s) => s.setAvailability);
  const barState = useLiveStore((s) => s.barState);
  const barStateLoaded = useLiveStore((s) => s.barStateLoaded);

  const [flash, setFlash] = useState(false);
  const prevAccepting = useRef<boolean | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let closed = false;

    const onState = (e: MessageEvent) => {
      try {
        setBarState(JSON.parse(e.data) as BarState);
      } catch {}
    };

    const connect = () => {
      if (closed) return;
      es = new EventSource("/api/guest/stream");
      es.addEventListener("bar.state", onState);
      es.addEventListener("bar.state_changed", onState);
      es.addEventListener(
        "cocktail.availability_changed",
        (e: MessageEvent) => {
          try {
            const d = JSON.parse(e.data) as {
              id: string;
              isAvailable: boolean;
            };
            setAvailability(d.id, d.isAvailable);
          } catch {}
        },
      );
      es.onopen = () => {
        attempts = 0;
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;
        attempts += 1;
        const delay = Math.min(1000 * 2 ** (attempts - 1), 30_000);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [setBarState, setAvailability]);

  useEffect(() => {
    if (!barStateLoaded) return;
    if (prevAccepting.current === false && barState.acceptingOrders === true) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 4000);
      prevAccepting.current = barState.acceptingOrders;
      return () => clearTimeout(t);
    }
    prevAccepting.current = barState.acceptingOrders;
  }, [barState.acceptingOrders, barStateLoaded]);

  if (!barStateLoaded) return null;

  if (!barState.acceptingOrders) {
    const until = formatUntil(barState.pauseUntil);
    return (
      <div className="sticky top-0 z-40 border-b border-guest-danger-border bg-guest-danger-bg px-4 py-3 shadow-[var(--shadow-guest-card)]">
        <div className="mx-auto flex max-w-2xl items-start gap-3">
          <PauseCircle
            size={22}
            className="mt-0.5 shrink-0 text-guest-danger-ink"
          />
          <div>
            <p className="text-sm font-bold text-guest-danger-ink">
              Bestellannahme gerade pausiert
            </p>
            <p className="mt-0.5 text-sm text-guest-danger-ink">
              {barState.pauseMessage ?? "Wir kommen gleich wieder!"}
            </p>
            {until && (
              <p className="mt-1 text-xs font-medium text-guest-danger-ink">
                Voraussichtlich bis {until} Uhr
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (flash) {
    return (
      <div className="sticky top-0 z-40 border-b border-guest-success-border bg-guest-success-bg px-4 py-2.5 shadow-[var(--shadow-guest-card)]">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-2">
          <CheckCircle2 size={18} className="text-guest-success-ink" />
          <p className="text-sm font-semibold text-guest-success-ink">
            Bestellannahme läuft wieder!
          </p>
        </div>
      </div>
    );
  }

  return null;
}
