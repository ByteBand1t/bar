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
          "flex items-center justify-center bg-purple-900/40 text-5xl",
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

  const isAvailable = cocktail.isAvailable;

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
            "group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer",
            isAvailable
              ? "border-purple-800 hover:border-amber-500/50 bg-[#1a1030] hover:shadow-lg hover:shadow-purple-900/30"
              : "border-purple-900/50 bg-[#120d20] opacity-60 cursor-not-allowed"
          )}
          role="button"
          tabIndex={isAvailable ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
        >
          {/* Image */}
          <div className="relative h-40 w-full bg-purple-900/20">
            <CocktailImage
              filename={cocktail.imageFilename}
              name={cocktail.name}
              className="absolute inset-0"
            />
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-400 bg-black/60 px-3 py-1 rounded-full">
                  Nicht verfügbar
                </span>
              </div>
            )}
            {cocktail.isAlcoholFree && (
              <span className="absolute top-2 left-2 text-xs bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-medium">
                Alkoholfrei
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <h3 className="font-semibold text-amber-200 text-sm leading-tight">{cocktail.name}</h3>
            <p className="text-xs text-purple-300 mt-1 line-clamp-2 leading-relaxed">
              {cocktail.description}
            </p>
          </div>

          {/* Add button */}
          {isAvailable && (
            <div className="px-3 pb-3">
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(cocktail.id, cocktail.name);
                }}
              >
                <Plus size={16} />
                Hinzufügen
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
          <span className="text-xs bg-purple-800/60 text-purple-300 px-2 py-0.5 rounded-full capitalize">
            {cocktail.category}
          </span>
          {cocktail.isAlcoholFree && (
            <span className="text-xs bg-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded-full">
              Alkoholfrei
            </span>
          )}
          {cocktail.prepTimeMin && (
            <span className="text-xs bg-purple-800/60 text-purple-300 px-2 py-0.5 rounded-full">
              ~{cocktail.prepTimeMin} Min
            </span>
          )}
        </div>

        <p className="text-purple-200 mt-3 text-sm leading-relaxed">{cocktail.description}</p>

        {/* Ingredients */}
        {cocktail.ingredients.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Zutaten
            </h4>
            <ul className="space-y-1">
              {cocktail.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-purple-200">{ing.name}</span>
                  <span className="text-purple-400 font-mono text-xs">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {cocktail.steps.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Zubereitung
            </h4>
            <ol className="space-y-1.5">
              {cocktail.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-purple-200">
                  <span className="shrink-0 font-mono text-amber-500 text-xs mt-0.5">
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
          <div className="flex items-center gap-2 bg-purple-900/40 rounded-lg p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-2 rounded-md text-purple-200 hover:bg-purple-800/60 disabled:opacity-40"
              disabled={qty <= 1}
            >
              <Minus size={18} />
            </button>
            <span className="w-8 text-center font-semibold text-amber-200">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              className="p-2 rounded-md text-purple-200 hover:bg-purple-800/60 disabled:opacity-40"
              disabled={qty >= 10}
            >
              <Plus size={18} />
            </button>
          </div>

          <Button className="flex-1" size="lg" onClick={handleAdd}>
            <ShoppingCart size={20} />
            In den Warenkorb
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
