"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { OrderWithDetails } from "@/lib/event-bus";
import { playNotification } from "@/lib/sound";

type ConnectionState = "connecting" | "connected" | "disconnected";

export interface BarStateValue {
  acceptingOrders: boolean;
  pauseMessage: string | null;
  pauseUntil: string | null;
}

export function useBarStream() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [barState, setBarState] = useState<BarStateValue>({
    acceptingOrders: true,
    pauseMessage: null,
    pauseUntil: null,
  });
  const [lastEventAt, setLastEventAt] = useState<number>(() => Date.now());
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setConnectionState("connecting");
    const es = new EventSource("/api/bar/stream");
    esRef.current = es;

    es.addEventListener("snapshot", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      const data: OrderWithDetails[] = JSON.parse(e.data);
      setOrders(data);
      setConnectionState("connected");
      setReconnectAttempts(0);
      setLastEventAt(Date.now());
    });

    const onBarState = (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        setBarState(JSON.parse(e.data) as BarStateValue);
      } catch {}
    };
    es.addEventListener("bar.state", onBarState);
    es.addEventListener("bar.state_changed", onBarState);

    es.addEventListener("heartbeat", () => {
      if (mountedRef.current) setLastEventAt(Date.now());
    });

    es.addEventListener("order.created", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      setLastEventAt(Date.now());
      const order: OrderWithDetails = JSON.parse(e.data);
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
      playNotification();
    });

    es.addEventListener("order.updated", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      setLastEventAt(Date.now());
      const order: OrderWithDetails = JSON.parse(e.data);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });

    es.addEventListener("order.cancelled", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      const order: OrderWithDetails = JSON.parse(e.data);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    });

    es.addEventListener("order.completed", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      const order: OrderWithDetails = JSON.parse(e.data);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;
      setConnectionState("disconnected");
      setReconnectAttempts((prev) => prev + 1);
    };
  }, []);

  useEffect(() => {
    if (reconnectAttempts === 0) return;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30_000);
    reconnectTimer.current = setTimeout(connect, delay);
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [reconnectAttempts, connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !esRef.current) {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);

  const updateOrderOptimistic = useCallback(
    (id: string, patch: Partial<OrderWithDetails>) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    []
  );

  const removeOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return {
    orders,
    connectionState,
    reconnectAttempts,
    barState,
    lastEventAt,
    updateOrderOptimistic,
    removeOrder,
  };
}
