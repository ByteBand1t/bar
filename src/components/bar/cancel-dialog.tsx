"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CancelDialogProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CancelDialog({ onConfirm, onCancel, loading }: CancelDialogProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[#1a1030] rounded-2xl border border-red-800/60 shadow-2xl p-6 z-10">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-purple-400 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-red-300 mb-1">Bestellung stornieren</h2>
        <p className="text-sm text-purple-300 mb-4">Bitte gib einen Grund an (Pflichtfeld).</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            required
            rows={3}
            placeholder="Grund für die Stornierung..."
            className="w-full rounded-lg bg-black/30 border border-purple-700 px-3 py-2 text-white placeholder-purple-500 focus:outline-none focus:border-red-500 resize-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg border border-purple-700 text-purple-300 hover:bg-purple-800/30 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || loading}
              className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "..." : "Stornieren"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
