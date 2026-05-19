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
      es.addEventListener("cocktail.availability_changed", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data) as { id: string; isAvailable: boolean };
          setAvailability(d.id, d.isAvailable);
        } catch {}
      });
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
    if (
      prevAccepting.current === false &&
      barState.acceptingOrders === true
    ) {
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
      <div className="sticky top-0 z-40 bg-red-900 border-b-2 border-red-600 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-start gap-3">
          <PauseCircle size={22} className="text-red-300 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-100 text-sm">
              Bestellannahme gerade pausiert
            </p>
            <p className="text-red-200 text-sm mt-0.5">
              {barState.pauseMessage ?? "Wir kommen gleich wieder!"}
            </p>
            {until && (
              <p className="text-red-300 text-xs mt-1">
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
      <div className="sticky top-0 z-40 bg-emerald-800 border-b-2 border-emerald-500 px-4 py-2.5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-2 justify-center">
          <CheckCircle2 size={18} className="text-emerald-300" />
          <p className="font-semibold text-emerald-100 text-sm">
            Bestellannahme läuft wieder!
          </p>
        </div>
      </div>
    );
  }

  return null;
}
