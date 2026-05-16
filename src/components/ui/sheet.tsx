"use client";

import * as React from "react";

interface SheetProps {
  children: React.ReactNode;
}

export function Sheet({ children }: SheetProps) {
  return <>{children}</>;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function SheetTrigger({ children, onClick }: SheetTriggerProps) {
  return <span onClick={onClick}>{children}</span>;
}

interface SheetContentProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
}

export function SheetContent({ open, onClose, children, side = "right" }: SheetContentProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <div
        className={`fixed top-0 ${side === "right" ? "right-0" : "left-0"} h-full w-[480px] max-w-full bg-[#0f0a1e] border-l border-purple-800/50 z-50 overflow-y-auto shadow-2xl`}
      >
        {children}
      </div>
    </>
  );
}
