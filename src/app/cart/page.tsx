"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

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
          items: items.map((item) => ({
            cocktailId: item.cocktailId,
            quantity: item.quantity,
            itemNote: item.itemNote || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error ?? "Bestellung konnte nicht abgeschickt werden. Bitte nochmal versuchen.";
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
        <div className="text-purple-400">Lade...</div>
      </div>
    );
  }

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
          <h1 className="text-lg font-bold text-amber-300">Deine Bestellung</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pb-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* Cart items */}
          <section className="mt-4">
            <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
              Ausgewählte Getränke
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-10 text-purple-400">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                <p>Dein Warenkorb ist leer</p>
                <Link href="/" className="text-amber-400 underline text-sm mt-2 inline-block">
                  Zurück zur Auswahl
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.cocktailId}
                    className="flex items-center gap-3 bg-[#1a1030] rounded-xl p-3 border border-purple-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-amber-200 text-sm truncate">{item.name}</p>
                    </div>

                    <div className="flex items-center gap-1 bg-purple-900/40 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cocktailId, item.quantity - 1)}
                        className="p-2 text-purple-300 hover:text-white disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-amber-200">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cocktailId, item.quantity + 1)}
                        className="p-2 text-purple-300 hover:text-white disabled:opacity-30"
                        disabled={item.quantity >= 10}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.cocktailId)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.items && <p className="text-red-400 text-sm mt-2">{errors.items}</p>}
          </section>

          {/* Guest info */}
          <section className="mt-6 space-y-4">
            <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
              Deine Infos
            </h2>

            <div>
              <label
                htmlFor="guestName"
                className="block text-sm font-medium text-purple-200 mb-1.5"
              >
                Dein Name <span className="text-red-400">*</span>
              </label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="z.B. Maria"
                maxLength={40}
                className="w-full bg-[#1a1030] border border-purple-700 rounded-xl px-4 py-3 text-purple-100 placeholder:text-purple-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-base"
              />
              {errors.guestName && (
                <p className="text-red-400 text-sm mt-1">{errors.guestName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guestTag"
                className="block text-sm font-medium text-purple-200 mb-1.5"
              >
                Wo bist du gerade? <span className="text-purple-500 text-xs">(optional)</span>
              </label>
              <input
                id="guestTag"
                type="text"
                value={guestTag}
                onChange={(e) => setGuestTag(e.target.value)}
                placeholder="z.B. Tisch 3, im Garten..."
                maxLength={40}
                className="w-full bg-[#1a1030] border border-purple-700 rounded-xl px-4 py-3 text-purple-100 placeholder:text-purple-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-base"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-purple-200 mb-1.5"
              >
                Notiz <span className="text-purple-500 text-xs">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='z.B. "bitte ohne Eis"'
                maxLength={200}
                rows={3}
                className="w-full bg-[#1a1030] border border-purple-700 rounded-xl px-4 py-3 text-purple-100 placeholder:text-purple-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-base resize-none"
              />
              <p className="text-xs text-purple-600 mt-1 text-right">{notes.length}/200</p>
            </div>
          </section>

          {/* Submit */}
          <div className="mt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || items.length === 0}
            >
              {submitting ? "Wird abgeschickt..." : "Bestellung abschicken"}
            </Button>
          </div>
        </form>
      </main>

      <Toaster />
    </>
  );
}
