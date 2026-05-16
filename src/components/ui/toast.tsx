"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  variant?: "default" | "error";
}

let listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

export function addToast(message: string, variant: "default" | "error" = "default") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, variant }];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => removeToast(id), 4000);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l(toasts));
}

export function Toaster() {
  const [active, setActive] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setActive);
    return () => {
      listeners = listeners.filter((l) => l !== setActive);
    };
  }, []);

  if (active.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-sm">
      {active.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium",
            toast.variant === "error"
              ? "bg-red-900 text-red-100 border border-red-700"
              : "bg-purple-800 text-purple-100 border border-purple-600"
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
