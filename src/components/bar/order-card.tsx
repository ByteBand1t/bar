"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, MoreVertical, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CancelDialog } from "./cancel-dialog";
import { RecipeModal } from "./recipe-modal";
import type { OrderWithDetails } from "@/lib/event-bus";

interface OrderCardProps {
  order: OrderWithDetails;
  onStatusChange: (id: string, status: string, optimisticFn: () => void, rollbackFn: () => void) => void;
  onCancel: (id: string, reason: string, optimisticFn: () => void, rollbackFn: () => void) => void;
  isNew?: boolean;
}

function useElapsedSeconds(createdAt: string | Date): number {
  const [elapsed, setElapsed] = useState(
    () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);
  return elapsed;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timerColor(status: string, seconds: number): string {
  const m = seconds / 60;
  if (status === "new") {
    if (m >= 5) return "text-red-400";
    if (m >= 3) return "text-yellow-400";
    return "text-emerald-400";
  }
  if (status === "in_progress") {
    if (m >= 10) return "text-red-400";
    if (m >= 5) return "text-yellow-400";
    return "text-emerald-400";
  }
  if (status === "ready") {
    if (m >= 2) return "text-orange-400";
    return "text-emerald-400";
  }
  return "text-bar-muted";
}

export function OrderCard({ order, onStatusChange, onCancel, isNew }: OrderCardProps) {
  const elapsed = useElapsedSeconds(order.createdAt);
  const [showCancel, setShowCancel] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [highlight, setHighlight] = useState(isNew ?? false);

  const prevStatusRef = useRef(order.status);
  useEffect(() => {
    if (prevStatusRef.current !== order.status) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 600);
      prevStatusRef.current = order.status;
      return () => clearTimeout(t);
    }
  }, [order.status]);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setHighlight(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  const isStale = order.status === "new" && elapsed > 3600;

  const handleStatus = (newStatus: string) => {
    const prev = order.status;
    onStatusChange(
      order.id,
      newStatus,
      () => {},
      () => { console.warn("rollback to", prev); }
    );
  };

  const handleCancel = (reason: string) => {
    setCancelLoading(true);
    const prev = order.status;
    onCancel(
      order.id,
      reason,
      () => { setShowCancel(false); setCancelLoading(false); },
      () => { setCancelLoading(false); console.warn("cancel rollback to", prev); }
    );
  };

  return (
    <>
      <div
        className={`rounded-xl border p-4 space-y-3 transition-all ${
          highlight ? "ring-2 ring-amber-400 scale-[1.01]" : ""
        } ${
          isStale
            ? "bg-red-950/70 border-red-500/70 shadow-lg shadow-red-950/30 stale-order"
            : "bg-bar-surface border-bar-border shadow-lg shadow-black/10"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-lg text-bar-ink truncate">{order.guestName}</p>
            {order.guestTag && (
              <p className="text-xs text-bar-muted mt-0.5">{order.guestTag}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowRecipe(true)}
              className="p-1.5 rounded-lg text-bar-muted hover:text-accent hover:bg-bar-soft transition-colors"
              title="Rezept anzeigen"
            >
              <BookOpen size={16} />
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className={`text-2xl font-mono font-bold ${timerColor(order.status, elapsed)}`}>
          {formatTime(elapsed)}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 px-3 py-2">
            <p className="text-sm text-bar-ink">💬 {order.notes}</p>
          </div>
        )}

        {/* Items */}
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              {item.cocktail.imageFilename ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/images/${item.cocktail.imageFilename}`}
                  alt={item.cocktail.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-bar-soft flex items-center justify-center text-xl shrink-0">
                  🍹
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-bar-ink">
                  <span className="text-accent font-mono">×{item.quantity}</span>{" "}
                  {item.cocktail.name}
                </p>
                {item.itemNote && (
                  <p className="text-xs text-bar-muted italic mt-0.5">{item.itemNote}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {order.status === "new" && (
            <>
              <button
                onClick={() => handleStatus("in_progress")}
                className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-bar-ink font-semibold text-sm transition-colors"
              >
                Annehmen
              </button>
              <button
                onClick={() => handleStatus("completed")}
                className="px-3 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-bar-ink text-sm transition-colors"
              >
                Direkt fertig
              </button>
            </>
          )}

          {order.status === "in_progress" && (
            <>
              <button
                onClick={() => handleStatus("ready")}
                className="flex-1 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-bar-ink font-semibold text-sm transition-colors"
              >
                Fertig zur Abholung
              </button>
              <button
                onClick={() => handleStatus("completed")}
                className="px-3 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-bar-ink text-sm transition-colors"
              >
                Direkt fertig
              </button>
            </>
          )}

          {order.status === "ready" && (
            <>
              <button
                onClick={() => handleStatus("completed")}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-bar-ink font-semibold text-sm transition-colors"
              >
                Ausgegeben ✓
              </button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2.5 rounded-lg border border-bar-border text-bar-muted hover:bg-bar-soft transition-colors">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {order.status === "ready" && (
                <DropdownMenuItem onClick={() => handleStatus("in_progress")}>
                  <RotateCcw size={14} className="mr-2" /> Zurück zu In Arbeit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowCancel(true)}
                className="text-red-400 hover:text-red-300"
              >
                Stornieren
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showCancel && (
        <CancelDialog
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
          loading={cancelLoading}
        />
      )}

      {showRecipe && (
        <RecipeModal order={order} onClose={() => setShowRecipe(false)} />
      )}
    </>
  );
}
