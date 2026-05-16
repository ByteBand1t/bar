"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/cocktail";

const STATUS_LABELS: Record<string, string> = {
  new: "Neu – wartet auf die Bar",
  in_progress: "Wird zubereitet",
  ready: "Fertig – abholbereit!",
  completed: "Abgeholt",
  cancelled: "Abgebrochen",
};

const POLL_INTERVAL = 5000;

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 404) {
        setError("Bestellung nicht gefunden.");
        return;
      }
      if (!res.ok) {
        setError("Fehler beim Laden der Bestellung.");
        return;
      }
      const data: Order = await res.json();
      setOrder(data);
      setError(null);
    } catch {
      setError("Verbindungsfehler – bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
    const interval = setInterval(fetchOrder, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center text-purple-400">
          <RefreshCw size={32} className="mx-auto mb-2 animate-spin" />
          <p>Lade Bestellung...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-dvh px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-red-400 mb-4">{error ?? "Bestellung nicht gefunden"}</p>
          <Link href="/" className="text-amber-400 underline">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const isReady = order.status === "ready";
  const isCancelled = order.status === "cancelled";
  const isDone = order.status === "completed";

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0f0a1e]/90 backdrop-blur-md border-b border-purple-900/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-full text-purple-300 hover:bg-purple-800/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-amber-300">Bestellstatus</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pb-8">
        {/* Ready state – big highlight */}
        {isReady && (
          <div className="mt-4 rounded-2xl bg-emerald-900/30 border border-emerald-600 p-6 text-center">
            <div className="text-5xl mb-3">🍹</div>
            <h2 className="text-xl font-bold text-emerald-300">
              Dein Getränk ist fertig!
            </h2>
            <p className="text-emerald-200 mt-2">Komm zur Bar und hol es ab!</p>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="mt-4 rounded-2xl bg-red-900/30 border border-red-700 p-5">
            <h2 className="text-lg font-bold text-red-300 mb-1">Bestellung abgebrochen</h2>
            <p className="text-red-200 text-sm">
              {order.cancelReason
                ? `Grund: ${order.cancelReason}`
                : "Die Bar hat die Bestellung leider abgebrochen. Du kannst gerne eine neue aufgeben!"}
            </p>
          </div>
        )}

        {/* Status card */}
        <div
          className={`mt-4 bg-[#1a1030] rounded-2xl border p-5 ${isReady ? "border-emerald-700" : isCancelled ? "border-red-800" : "border-purple-800/50"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-purple-400">Bestellung für</p>
              <p className="font-bold text-amber-200 text-lg">{order.guestName}</p>
              {order.guestTag && (
                <p className="text-sm text-purple-300 mt-0.5">📍 {order.guestTag}</p>
              )}
            </div>
            <Badge variant={order.status as BadgeVariant}>
              {STATUS_LABELS[order.status] ?? order.status}
            </Badge>
          </div>

          {!isReady && !isCancelled && !isDone && (
            <div className="mb-4">
              <StatusProgress status={order.status} />
            </div>
          )}

          {/* Items */}
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            Bestellte Getränke
          </h3>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-purple-200">{item.cocktail.name}</span>
                <span className="font-mono text-amber-300">×{item.quantity}</span>
              </li>
            ))}
          </ul>

          {order.notes && (
            <div className="mt-3 pt-3 border-t border-purple-800/50">
              <p className="text-xs text-purple-400">Notiz: {order.notes}</p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-purple-800/50 flex items-center justify-between">
            <p className="text-xs text-purple-500">
              {new Date(order.createdAt).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })} Uhr
            </p>
            <span className="text-xs text-purple-600 flex items-center gap-1">
              <RefreshCw size={10} />
              Aktualisiert alle 5 Sek.
            </span>
          </div>
        </div>

        {/* New order CTA */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-amber-400 hover:text-amber-300 font-medium underline">
            Noch ein Drink bestellen →
          </Link>
        </div>
      </main>
    </>
  );
}

type BadgeVariant = "new" | "in_progress" | "ready" | "completed" | "cancelled";

function StatusProgress({ status }: { status: string }) {
  const steps = [
    { key: "new", label: "Bestellt" },
    { key: "in_progress", label: "In Arbeit" },
    { key: "ready", label: "Fertig" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIdx ? "bg-amber-500" : "bg-purple-900"}`}
          />
          <div className="text-center">
            <div
              className={`mx-1 w-2.5 h-2.5 rounded-full ${i <= currentIdx ? "bg-amber-400" : "bg-purple-800"}`}
            />
            <p
              className={`text-[10px] mt-0.5 ${i <= currentIdx ? "text-amber-300" : "text-purple-600"}`}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
