"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useLiveStore } from "@/store/live";
import { Button } from "@/components/ui/button";
import { GuestLive } from "@/components/guest-live";
import { addToast, Toaster } from "@/components/ui/toast";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [guestName, setGuestName] = useState("");
  const [guestTag, setGuestTag] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const acceptingOrders = useLiveStore((s) => s.barState.acceptingOrders);
  const availability = useLiveStore((s) => s.availability);
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "",
  );

  const unavailableIds = items
    .filter((i) => availability[i.cocktailId] === false)
    .map((i) => i.cocktailId);
  const hasUnavailable = unavailableIds.length > 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!guestName.trim() || guestName.trim().length < 2) {
      errs.guestName = "Name muss mindestens 2 Zeichen lang sein";
    } else if (guestName.trim().length > 40) {
      errs.guestName = "Name darf maximal 40 Zeichen lang sein";
    }
    if (items.length === 0) {
      errs.items = "Bitte mindestens ein Getränk hinzufügen";
    }
    if (!acceptingOrders) {
      errs.items = "Bestellannahme ist gerade pausiert";
    }
    if (hasUnavailable) {
      errs.items =
        "Manche Getränke sind nicht mehr verfügbar – bitte entfernen.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestTag: guestTag.trim() || undefined,
          notes: notes.trim() || undefined,
          idempotencyKey: idempotencyKey || undefined,
          items: items.map((item) => ({
            cocktailId: item.cocktailId,
            quantity: item.quantity,
            itemNote: item.itemNote || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "items_unavailable") {
          setErrors({
            items:
              "Manche Getränke sind nicht mehr verfügbar – bitte entfernen.",
          });
          addToast(data.message ?? "Getränke nicht mehr verfügbar", "error");
          return;
        }
        if (data.error === "bar_paused") {
          setErrors({ items: data.message ?? "Bestellannahme pausiert" });
          addToast(data.message ?? "Bestellannahme pausiert", "error");
          return;
        }
        const msg =
          data.message ??
          "Bestellung konnte nicht abgeschickt werden. Bitte nochmal versuchen.";
        addToast(msg, "error");
        return;
      }

      clearCart();
      router.push(`/status/${data.id}`);
    } catch {
      addToast("Netzwerkfehler – bitte nochmal versuchen.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-guest-muted">Lade...</div>
      </div>
    );
  }

  return (
    <>
      <GuestLive />
      <header className="sticky top-0 z-30 border-b border-guest-border bg-guest-surface/85 px-4 py-3 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full p-2 text-guest-ink transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-guest-ink">Deine Bestellung</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pb-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* Cart items */}
          <section className="mt-4">
            <h2 className="text-sm font-semibold text-guest-ink uppercase tracking-wider mb-3">
              Ausgewählte Getränke
            </h2>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-guest-border bg-guest-surface py-10 text-center text-guest-muted shadow-[var(--shadow-guest-card)]">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                <p>Dein Warenkorb ist leer</p>
                <Link
                  href="/"
                  className="mt-2 inline-block text-sm font-medium text-accent underline"
                >
                  Zurück zur Auswahl
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.cocktailId}
                    className={`flex items-center gap-3 rounded-2xl border p-3 shadow-[var(--shadow-guest-card)] ${
                      availability[item.cocktailId] === false
                        ? "border-guest-danger-border bg-guest-danger-bg"
                        : "border-guest-border bg-guest-surface"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-guest-ink">
                        {item.name}
                      </p>
                      {availability[item.cocktailId] === false && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-guest-danger-ink">
                          <AlertTriangle size={12} />
                          nicht mehr verfügbar – bitte entfernen
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-guest-border bg-guest-bg p-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cocktailId, item.quantity - 1)
                        }
                        className="min-h-10 min-w-10 rounded-lg p-2 text-guest-ink hover:bg-accent-soft hover:text-accent disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-guest-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cocktailId, item.quantity + 1)
                        }
                        className="min-h-10 min-w-10 rounded-lg p-2 text-guest-ink hover:bg-accent-soft hover:text-accent disabled:opacity-30"
                        disabled={item.quantity >= 10}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.cocktailId)}
                      className="min-h-10 min-w-10 rounded-lg p-2 text-guest-danger-ink hover:bg-guest-danger-bg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.items && (
              <p className="mt-2 text-sm font-medium text-guest-danger-ink">
                {errors.items}
              </p>
            )}
          </section>

          {/* Guest info */}
          <section className="mt-6 space-y-4">
            <h2 className="text-sm font-semibold text-guest-ink uppercase tracking-wider">
              Deine Infos
            </h2>

            <div>
              <label
                htmlFor="guestName"
                className="mb-1.5 block text-sm font-semibold text-guest-ink"
              >
                Dein Name <span className="text-guest-danger-ink">*</span>
              </label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="z.B. Maria"
                maxLength={40}
                className="w-full rounded-xl border border-guest-border bg-guest-input px-4 py-3 text-base text-guest-ink placeholder:text-guest-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
              {errors.guestName && (
                <p className="mt-1 text-sm font-medium text-guest-danger-ink">
                  {errors.guestName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="guestTag"
                className="mb-1.5 block text-sm font-semibold text-guest-ink"
              >
                Wo bist du gerade?{" "}
                <span className="text-xs text-guest-muted">(optional)</span>
              </label>
              <input
                id="guestTag"
                type="text"
                value={guestTag}
                onChange={(e) => setGuestTag(e.target.value)}
                placeholder="z.B. Tisch 3, im Garten..."
                maxLength={40}
                className="w-full rounded-xl border border-guest-border bg-guest-input px-4 py-3 text-base text-guest-ink placeholder:text-guest-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm font-semibold text-guest-ink"
              >
                Notiz{" "}
                <span className="text-xs text-guest-muted">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='z.B. "bitte ohne Eis"'
                maxLength={200}
                rows={3}
                className="w-full resize-none rounded-xl border border-guest-border bg-guest-input px-4 py-3 text-base text-guest-ink placeholder:text-guest-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
              <p className="mt-1 text-right text-xs text-guest-muted">
                {notes.length}/200
              </p>
            </div>
          </section>

          {/* Submit */}
          <div className="mt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent text-accent-fg shadow-[var(--shadow-guest-button)] hover:bg-accent-hover active:bg-accent-hover focus-visible:ring-accent"
              disabled={
                submitting ||
                items.length === 0 ||
                !acceptingOrders ||
                hasUnavailable
              }
              title={
                !acceptingOrders
                  ? "Bestellannahme gerade pausiert"
                  : hasUnavailable
                    ? "Nicht verfügbare Getränke entfernen"
                    : undefined
              }
            >
              {submitting
                ? "Wird abgeschickt..."
                : !acceptingOrders
                  ? "Bestellannahme pausiert"
                  : hasUnavailable
                    ? "Nicht verfügbare Getränke entfernen"
                    : "Bestellung abschicken"}
            </Button>
          </div>
        </form>
      </main>

      <Toaster theme="guest" />
    </>
  );
}
