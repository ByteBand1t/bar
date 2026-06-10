"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  Pencil,
  Copy,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Cocktail {
  id: string;
  name: string;
  description: string;
  imageFilename: string | null;
  category: string;
  isAlcoholFree: boolean;
  isAvailable: boolean;
  isArchived: boolean;
  sortOrder: number;
  _count: { orderItems: number };
}

function AvailabilityToggle({
  id,
  isAvailable,
  onToggle,
}: {
  id: string;
  isAvailable: boolean;
  onToggle: (id: string, value: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cocktails/${id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      if (res.ok) {
        onToggle(id, !isAvailable);
      } else {
        toast.error("Toggle fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      title={isAvailable ? "Verfügbar – klicken zum Deaktivieren" : "Nicht verfügbar – klicken zum Aktivieren"}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        isAvailable ? "bg-emerald-500" : "bg-admin-border"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          isAvailable ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SortableCocktailRow({
  cocktail,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  cocktail: Cocktail;
  onToggle: (id: string, value: boolean) => void;
  onDuplicate: (id: string) => Promise<void>;
  onDelete: (cocktail: Cocktail) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cocktail.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-admin-surface border border-admin-border rounded-2xl px-3 py-3 shadow-sm hover:border-accent/30 hover:shadow-md transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-admin-muted hover:text-accent cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={18} />
      </button>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-accent-soft shrink-0 flex items-center justify-center text-xl">
        {cocktail.imageFilename ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${cocktail.imageFilename}`}
            alt={cocktail.name}
            className="w-full h-full object-cover"
          />
        ) : (
          "🍹"
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-admin-ink text-sm truncate">{cocktail.name}</span>
          <span className="text-xs bg-accent-soft text-accent px-2 py-0.5 rounded-full shrink-0">
            {cocktail.category}
          </span>
          {cocktail.isArchived && (
            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full shrink-0">
              Archiviert
            </span>
          )}
          {cocktail.isAlcoholFree && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
              Alkoholfrei
            </span>
          )}
        </div>
        <p className="text-xs text-admin-muted truncate mt-0.5">{cocktail.description}</p>
      </div>

      {/* Toggle */}
      <div className="shrink-0">
        <AvailabilityToggle
          id={cocktail.id}
          isAvailable={cocktail.isAvailable}
          onToggle={onToggle}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/admin/cocktails/${cocktail.id}`}
          className="p-1.5 text-admin-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
          title="Bearbeiten"
        >
          <Pencil size={15} />
        </Link>
        <button
          onClick={() => onDuplicate(cocktail.id)}
          className="p-1.5 text-admin-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
          title="Duplizieren"
        >
          <Copy size={15} />
        </button>
        <button
          onClick={() => onDelete(cocktail)}
          className="p-1.5 text-admin-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Löschen"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

const CATEGORIES = ["Alle", "Cocktail", "Longdrink", "Softdrink", "Bier", "Wein", "Shot"];

export function AdminCocktailList() {
  const router = useRouter();
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [deleteTarget, setDeleteTarget] = useState<Cocktail | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/cocktails");
      if (res.ok) {
        const data = await res.json();
        setCocktails(data);
      }
    } catch {
      toast.error("Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => { await load(); };
    void run();
  }, [load]);

  const filtered = cocktails.filter((c) => {
    const matchCat = categoryFilter === "Alle" || c.category === categoryFilter;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggle = (id: string, value: boolean) => {
    setCocktails((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isAvailable: value } : c))
    );
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/admin/cocktails/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const dup = await res.json();
      toast.success("Duplikat erstellt");
      router.push(`/admin/cocktails/${dup.id}`);
    } else {
      toast.error("Duplizieren fehlgeschlagen");
    }
  };

  const handleDeleteClick = async (cocktail: Cocktail) => {
    setDeleteTarget(cocktail);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/cocktails/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        if (data.archived) {
          toast.info("Cocktail archiviert (hatte Bestellungen)");
          setCocktails((prev) =>
            prev.map((c) =>
              c.id === deleteTarget.id ? { ...c, isAvailable: false, isArchived: true } : c
            )
          );
        } else {
          toast.success("Cocktail gelöscht");
          setCocktails((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        }
      } else {
        toast.error("Löschen fehlgeschlagen");
      }
    } catch {
      toast.error("Verbindungsfehler");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cocktails.findIndex((c) => c.id === active.id);
    const newIndex = cocktails.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(cocktails, oldIndex, newIndex);

    // Optimistic update
    setCocktails(reordered);

    try {
      const res = await fetch("/api/admin/cocktails/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
      });
      if (!res.ok) {
        // Rollback
        setCocktails(cocktails);
        toast.error("Reihenfolge konnte nicht gespeichert werden");
      }
    } catch {
      setCocktails(cocktails);
      toast.error("Verbindungsfehler");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-admin-ink">Cocktail-Karte</h1>
        <Link
          href="/admin/cocktails/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-fg shadow-sm font-semibold rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Neuer Cocktail
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Name oder Beschreibung…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-admin-surface border border-admin-border rounded-xl text-admin-ink placeholder-admin-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                categoryFilter === cat
                  ? "bg-accent border-accent text-accent-fg font-semibold shadow-sm"
                  : "border-admin-border text-admin-muted hover:border-accent/40 hover:text-accent bg-admin-surface"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-admin-muted">
          {search || categoryFilter !== "Alle" ? "Keine Treffer" : "Noch keine Cocktails – leg los!"}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cocktails.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filtered.map((cocktail) => (
                <SortableCocktailRow
                  key={cocktail.id}
                  cocktail={cocktail}
                  onToggle={handleToggle}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-admin-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-admin-ink mb-2">
              {deleteTarget._count.orderItems > 0 ? "Cocktail archivieren?" : "Cocktail löschen?"}
            </h2>
            {deleteTarget._count.orderItems > 0 ? (
              <p className="text-admin-muted text-sm leading-relaxed">
                <strong className="text-accent">{deleteTarget.name}</strong> wurde bereits bestellt
                und wird daher nur archiviert. Er erscheint nicht mehr in der Karte, bleibt aber für
                Statistik und Verlauf erhalten.
              </p>
            ) : (
              <p className="text-admin-muted text-sm">
                <strong className="text-accent">{deleteTarget.name}</strong> wird dauerhaft
                gelöscht. Dies kann nicht rückgängig gemacht werden.
              </p>
            )}
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm text-admin-muted hover:text-admin-ink transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                {deleteTarget._count.orderItems > 0 ? "Archivieren" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
