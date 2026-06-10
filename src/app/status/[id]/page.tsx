"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types/cocktail";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  new: "Neu – wartet auf die Bar",
  in_progress: "Wird zubereitet",
  ready: "Fertig – abholbereit!",
  completed: "Abgeholt",
  cancelled: "Abgebrochen",
};

const GUEST_BADGE_CLASSES: Record<BadgeVariant, string> = {
  new: "bg-guest-bg text-guest-ink ring-1 ring-guest-border",
  in_progress: "bg-accent-soft text-accent-hover ring-1 ring-accent-soft",
  ready:
    "bg-guest-success-bg text-guest-success-ink ring-1 ring-guest-success-border",
  completed: "bg-guest-bg text-guest-muted ring-1 ring-guest-border",
  cancelled:
    "bg-guest-danger-bg text-guest-danger-ink ring-1 ring-guest-danger-border",
};

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/orders/${id}/stream`);

    const handleOrder = (data: Order) => {
      setOrder(data);
      setLoading(false);
      setError(null);

      if (
        prevStatusRef.current !== null &&
        prevStatusRef.current !== data.status
      ) {
        if (data.status === "ready") {
          try {
            navigator.vibrate([200, 100, 200]);
          } catch {}
          if (Notification.permission === "granted") {
            new Notification("Dein Drink ist fertig! 🍹", {
              body: "Komm zur Bar und hol ihn ab!",
            });
          }
        }
      }
      prevStatusRef.current = data.status;
    };

    es.addEventListener("order.current", (e: MessageEvent) => {
      handleOrder(JSON.parse(e.data));
    });

    const eventTypes = [
      "order.created",
      "order.updated",
      "order.cancelled",
      "order.completed",
    ];
    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        handleOrder(JSON.parse(e.data));
      });
    });

    es.onerror = () => {
      setLoading((prev) => {
        if (prev) setError("Verbindungsfehler – bitte Seite neu laden.");
        return false;
      });
    };

    return () => es.close();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-guest-bg">
        <div className="text-center text-guest-muted">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p>Lade Bestellung...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-guest-bg px-4">
        <div className="rounded-2xl border border-guest-border bg-guest-surface p-6 text-center shadow-[var(--shadow-guest-card)]">
          <div className="mb-3 text-4xl">😕</div>
          <p className="mb-4 text-guest-danger-ink">
            {error ?? "Bestellung nicht gefunden"}
          </p>
          <Link href="/" className="font-medium text-accent underline">
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
      <header className="sticky top-0 z-30 border-b border-guest-border bg-guest-surface/85 px-4 py-3 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full p-2 text-guest-ink transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-guest-ink">Bestellstatus</h1>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-guest-muted">Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pb-8">
        {isReady && (
          <div className="mt-4 rounded-2xl border border-guest-success-border bg-guest-success-bg p-6 text-center shadow-[var(--shadow-guest-card)]">
            <div className="mb-3 text-5xl">🍹</div>
            <h2 className="text-xl font-bold text-guest-success-ink">
              Dein Getränk ist fertig!
            </h2>
            <p className="mt-2 text-sm font-medium text-guest-success-ink">
              Komm zur Bar und hol es ab!
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="mt-4 rounded-2xl border border-guest-danger-border bg-guest-danger-bg p-5 shadow-[var(--shadow-guest-card)]">
            <h2 className="mb-1 text-lg font-bold text-guest-danger-ink">
              Bestellung abgebrochen
            </h2>
            <p className="text-sm text-guest-danger-ink">
              {order.cancelReason
                ? `Grund: ${order.cancelReason}`
                : "Die Bar hat die Bestellung leider abgebrochen. Du kannst gerne eine neue aufgeben!"}
            </p>
          </div>
        )}

        <div
          className={cn(
            "mt-4 rounded-2xl border bg-guest-surface p-5 shadow-[var(--shadow-guest-card)]",
            isReady
              ? "border-guest-success-border"
              : isCancelled
                ? "border-guest-danger-border"
                : "border-guest-border",
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-guest-muted">Bestellung für</p>
              <p className="text-lg font-bold text-guest-ink">
                {order.guestName}
              </p>
              {order.guestTag && (
                <p className="mt-0.5 text-sm text-guest-muted">
                  📍 {order.guestTag}
                </p>
              )}
            </div>
            <Badge
              variant={order.status as BadgeVariant}
              className={GUEST_BADGE_CLASSES[order.status as BadgeVariant]}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </Badge>
          </div>

          {!isReady && !isCancelled && !isDone && (
            <div className="mb-4">
              <StatusProgress status={order.status} />
            </div>
          )}

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-guest-ink">
            Bestellte Getränke
          </h3>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-guest-ink">{item.cocktail.name}</span>
                <span className="font-mono font-semibold text-accent">
                  ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>

          {order.notes && (
            <div className="mt-3 pt-3 border-t border-guest-border">
              <p className="text-xs text-guest-muted">Notiz: {order.notes}</p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-guest-border">
            <p className="text-xs text-guest-muted">
              {new Date(order.createdAt).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              Uhr
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="font-medium text-accent underline hover:text-accent-hover"
          >
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
            className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? "bg-accent" : "bg-guest-border"}`}
          />
          <div className="text-center">
            <div
              className={`mx-1 w-2.5 h-2.5 rounded-full ${i <= currentIdx ? "bg-accent" : "bg-guest-border"}`}
            />
            <p
              className={`text-[10px] mt-0.5 ${i <= currentIdx ? "text-accent-hover" : "text-guest-muted"}`}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
