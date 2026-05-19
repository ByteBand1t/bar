"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { SheetContent } from "@/components/ui/sheet";
import { addToast } from "@/components/ui/toast";

interface BarCocktail {
  id: string;
  name: string;
  imageFilename: string | null;
  isAvailable: boolean;
}

export function AvailabilityDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [cocktails, setCocktails] = useState<BarCocktail[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/bar/cocktails")
      .then((r) => r.json())
      .then((data: BarCocktail[]) => setCocktails(data))
      .catch(() => addToast("Cocktails konnten nicht geladen werden", "error"))
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = async (c: BarCocktail) => {
    const next = !c.isAvailable;
    setCocktails((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, isAvailable: next } : x))
    );
    try {
      const res = await fetch(`/api/bar/cocktails/${c.id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCocktails((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, isAvailable: c.isAvailable } : x))
      );
      addToast(`${c.name}: Umschalten fehlgeschlagen`, "error");
    }
  };

  const filtered = cocktails.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <SheetContent open={open} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-300">🍋 Verfügbarkeit</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-800/40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="w-full bg-[#1a1030] border border-purple-700 rounded-xl pl-9 pr-3 py-2 text-sm text-purple-100 placeholder:text-purple-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {loading && (
          <p className="text-sm text-purple-400 text-center py-6">Lädt…</p>
        )}

        <ul className="space-y-1.5">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 bg-[#1a1030] rounded-lg p-2 border border-purple-800/40"
            >
              {c.imageFilename ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/images/${c.imageFilename}`}
                  alt={c.name}
                  className="w-9 h-9 rounded-md object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-md bg-purple-900/50 flex items-center justify-center text-sm shrink-0">
                  🍹
                </div>
              )}
              <span
                className={`flex-1 text-sm truncate ${
                  c.isAvailable ? "text-purple-100" : "text-purple-500 line-through"
                }`}
              >
                {c.name}
              </span>
              <button
                onClick={() => toggle(c)}
                role="switch"
                aria-checked={c.isAvailable}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  c.isAvailable ? "bg-emerald-600" : "bg-purple-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    c.isAvailable ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </li>
          ))}
          {!loading && filtered.length === 0 && (
            <li className="text-sm text-purple-500 text-center py-6">
              Nichts gefunden
            </li>
          )}
        </ul>
      </div>
    </SheetContent>
  );
}
