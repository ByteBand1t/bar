"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCartStore } from "@/store/cart";
import { useLiveStore } from "@/store/live";
import { cn } from "@/lib/utils";

interface Ingredient {
  name: string;
  amount: string;
}

interface Cocktail {
  id: string;
  name: string;
  description: string;
  imageFilename: string | null;
  category: string;
  isAlcoholFree: boolean;
  isAvailable: boolean;
  ingredients: Ingredient[];
  steps: string[];
  prepTimeMin: number | null;
}

interface CocktailCardProps {
  cocktail: Cocktail;
}

function CocktailImage({
  filename,
  name,
  className,
}: {
  filename: string | null;
  name: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!filename || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-accent-soft text-5xl",
          className
        )}
      >
        🍹
      </div>
    );
  }

  return (
    <Image
      src={`/api/images/${filename}`}
      alt={name}
      fill
      className="object-cover"
      onError={() => setError(true)}
      unoptimized
    />
  );
}

export function CocktailCard({ cocktail }: CocktailCardProps) {
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const override = useLiveStore((s) => s.availability[cocktail.id]);
  const acceptingOrders = useLiveStore((s) => s.barState.acceptingOrders);

  const isAvailable = override ?? cocktail.isAvailable;
  const canOrder = isAvailable && acceptingOrders;

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem(cocktail.id, cocktail.name);
    }
    setQty(1);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={isAvailable ? setOpen : undefined}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer",
            isAvailable
              ? "border-guest-border bg-guest-surface shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
              : "border-guest-border bg-guest-surface opacity-60 cursor-not-allowed"
          )}
          role="button"
          tabIndex={isAvailable ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
        >
          {/* Image */}
          <div className="relative h-40 w-full bg-accent-soft">
            <CocktailImage
              filename={cocktail.imageFilename}
              name={cocktail.name}
              className="absolute inset-0"
            />
            {!isAvailable && (
              <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
                <span className="text-sm font-semibold text-guest-ink bg-guest-surface/90 px-3 py-1 rounded-full shadow-sm">
                  Nicht verfügbar
                </span>
              </div>
            )}
            {cocktail.isAlcoholFree && (
              <span className="absolute top-2 left-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                Alkoholfrei
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <h3 className="font-bold text-guest-ink text-sm leading-tight">{cocktail.name}</h3>
            <p className="text-xs text-guest-muted mt-1 line-clamp-2 leading-relaxed">
              {cocktail.description}
            </p>
          </div>

          {/* Add button */}
          {isAvailable && (
            <div className="mt-auto px-3 pb-3">
              <Button
                size="sm"
                className="w-full bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-hover focus-visible:ring-accent"
                disabled={!canOrder}
                title={!acceptingOrders ? "Bestellannahme gerade pausiert" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canOrder) return;
                  addItem(cocktail.id, cocktail.name);
                }}
              >
                <Plus size={16} />
                {acceptingOrders ? "Hinzufügen" : "Pausiert"}
              </Button>
            </div>
          )}
        </div>
      </DialogTrigger>

      {/* Detail Bottom Sheet */}
      <DialogContent>
        <div className="relative h-52 -mx-6 -mt-6 mb-4 rounded-t-2xl overflow-hidden">
          <CocktailImage
            filename={cocktail.imageFilename}
            name={cocktail.name}
            className="absolute inset-0 w-full h-full"
          />
        </div>

        <DialogTitle>{cocktail.name}</DialogTitle>

        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="text-xs bg-accent-soft text-accent-hover px-2 py-0.5 rounded-full capitalize font-medium">
            {cocktail.category}
          </span>
          {cocktail.isAlcoholFree && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Alkoholfrei
            </span>
          )}
          {cocktail.prepTimeMin && (
            <span className="text-xs bg-guest-bg text-guest-muted px-2 py-0.5 rounded-full font-medium">
              ~{cocktail.prepTimeMin} Min
            </span>
          )}
        </div>

        <p className="text-guest-ink mt-3 text-sm leading-relaxed">{cocktail.description}</p>

        {/* Ingredients */}
        {cocktail.ingredients.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              Zutaten
            </h4>
            <ul className="space-y-1">
              {cocktail.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-guest-ink">{ing.name}</span>
                  <span className="text-guest-muted font-mono text-xs">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {cocktail.steps.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              Zubereitung
            </h4>
            <ol className="space-y-1.5">
              {cocktail.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-guest-ink">
                  <span className="shrink-0 font-mono text-accent text-xs mt-0.5">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Quantity + Add to cart */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-guest-bg border border-guest-border rounded-lg p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-2 rounded-md text-guest-ink hover:bg-guest-border disabled:opacity-40"
              disabled={qty <= 1}
            >
              <Minus size={18} />
            </button>
            <span className="w-8 text-center font-semibold text-guest-ink">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              className="p-2 rounded-md text-guest-ink hover:bg-guest-border disabled:opacity-40"
              disabled={qty >= 10}
            >
              <Plus size={18} />
            </button>
          </div>

          <Button
            className="flex-1 bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-hover focus-visible:ring-accent"
            size="lg"
            onClick={handleAdd}
            disabled={!canOrder}
            title={!acceptingOrders ? "Bestellannahme gerade pausiert" : undefined}
          >
            <ShoppingCart size={20} />
            {acceptingOrders ? "In den Warenkorb" : "Bestellannahme pausiert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
