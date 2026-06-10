"use client";

import { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { OrderWithDetails } from "@/lib/event-bus";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onReopen: (id: string) => void;
}

function formatDuration(createdAt: string | Date, endAt: string | Date | null | undefined): string {
  if (!endAt) return "—";
  const ms = new Date(endAt).getTime() - new Date(createdAt).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function itemsSummary(order: OrderWithDetails): string {
  return order.items
    .map((item) => `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.cocktail.name}`)
    .join(", ");
}

function HistoryTable({
  orders,
  onReopen,
  showCancelReason,
}: {
  orders: OrderWithDetails[];
  onReopen: (id: string) => void;
  showCancelReason?: boolean;
}) {
  if (orders.length === 0) {
    return <p className="text-center text-bar-muted/70 py-8 text-sm">Keine Einträge</p>;
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-lg bg-bar-bg/50 border border-bar-border p-3 space-y-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-medium text-bar-ink text-sm">{order.guestName}</span>
              {order.guestTag && (
                <span className="text-bar-muted text-xs ml-2">{order.guestTag}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-bar-muted/70">
                {formatDuration(order.createdAt, order.completedAt ?? order.updatedAt)}
              </span>
              <button
                onClick={() => onReopen(order.id)}
                className="p-1.5 rounded-lg text-bar-muted hover:text-accent hover:bg-bar-soft transition-colors"
                title="Wieder öffnen"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
          <p className="text-xs text-bar-muted truncate">{itemsSummary(order)}</p>
          <p className="text-xs text-bar-muted/70">
            {new Date(order.createdAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })} Uhr
          </p>
          {showCancelReason && order.cancelReason && (
            <p className="text-xs text-red-400 italic">Grund: {order.cancelReason}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function HistoryDrawer({ open, onClose, onReopen }: HistoryDrawerProps) {
  const [completed, setCompleted] = useState<OrderWithDetails[]>([]);
  const [cancelled, setCancelled] = useState<OrderWithDetails[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([
      fetch("/api/bar/orders?status=completed").then((r) => r.json()),
      fetch("/api/bar/orders?status=cancelled").then((r) => r.json()),
    ]).then(([comp, canc]) => {
      setCompleted(comp);
      setCancelled(canc);
      setLoaded(true);
    });
  }, [open, loaded]);

  const handleReopen = async (id: string) => {
    const res = await fetch(`/api/bar/orders/${id}/reopen`, { method: "POST" });
    if (res.ok) {
      setCompleted((prev) => prev.filter((o) => o.id !== id));
      setCancelled((prev) => prev.filter((o) => o.id !== id));
      onReopen(id);
    }
  };

  return (
    <SheetContent open={open} onClose={onClose} side="right">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-accent">Verlauf</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-bar-muted hover:text-white hover:bg-bar-soft transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <Tabs defaultValue="completed">
          <TabsList className="w-full">
            <TabsTrigger value="completed">
              Abgeschlossen ({completed.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Storniert ({cancelled.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="completed">
            <HistoryTable orders={completed} onReopen={handleReopen} />
          </TabsContent>
          <TabsContent value="cancelled">
            <HistoryTable orders={cancelled} onReopen={handleReopen} showCancelReason />
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  );
}
