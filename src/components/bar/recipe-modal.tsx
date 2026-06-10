"use client";

import { useState } from "react";
import { X, Clock } from "lucide-react";
import type { OrderWithDetails } from "@/lib/event-bus";
import type { Ingredient } from "@/types/cocktail";

interface RecipeModalProps {
  order: OrderWithDetails;
  onClose: () => void;
}

function parseAmount(amount: string): { num: number; unit: string } | null {
  const match = amount.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
  if (!match) return null;
  return { num: parseFloat(match[1]), unit: match[2].trim() };
}

function scaleIngredients(ingredients: Ingredient[], multiplier: number): Ingredient[] {
  return ingredients.map((ing) => {
    const parsed = parseAmount(ing.amount);
    if (!parsed) return ing;
    const scaled = parsed.num * multiplier;
    const rounded = Math.round(scaled * 10) / 10;
    return { ...ing, amount: `${rounded}${parsed.unit ? ` ${parsed.unit}` : ""}` };
  });
}

interface CocktailRecipeProps {
  cocktail: OrderWithDetails["items"][0]["cocktail"] & {
    ingredients: unknown;
    steps: unknown;
    prepTimeMin: number | null;
  };
  quantity: number;
  itemNote: string | null | undefined;
}

function CocktailRecipe({ cocktail, quantity, itemNote }: CocktailRecipeProps) {
  const [multiply, setMultiply] = useState(false);

  const ingredients = (cocktail.ingredients as Ingredient[]) ?? [];
  const steps = (cocktail.steps as string[]) ?? [];
  const displayed = multiply ? scaleIngredients(ingredients, quantity) : ingredients;

  return (
    <div className="space-y-4">
      {cocktail.imageFilename && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/images/${cocktail.imageFilename}`}
          alt={cocktail.name}
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: 200 }}
        />
      )}

      <h3 className="text-2xl font-bold text-accent">{cocktail.name}</h3>

      {itemNote && (
        <div className="rounded-lg bg-amber-900/30 border border-amber-600 px-4 py-3">
          <p className="text-bar-ink font-medium">⚠️ Notiz: {itemNote}</p>
        </div>
      )}

      {cocktail.prepTimeMin && (
        <div className="flex items-center gap-1.5 text-bar-muted text-sm">
          <Clock size={14} />
          <span>≈ {cocktail.prepTimeMin} Min Zubereitung</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-semibold text-bar-ink">Zutaten</h4>
          {quantity > 1 && (
            <button
              onClick={() => setMultiply((v) => !v)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                multiply
                  ? "bg-accent border-accent text-white"
                  : "border-purple-600 text-bar-muted hover:border-accent hover:text-accent"
              }`}
            >
              {multiply ? `×${quantity} aktiv` : `Für ${quantity} Drinks`}
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {displayed.map((ing, i) => (
            <li key={i} className="flex items-baseline justify-between text-xl">
              <span className="text-bar-ink">{ing.name}</span>
              <span className="text-accent font-mono ml-4 shrink-0">{ing.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      {steps.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-bar-ink mb-2">Zubereitung</h4>
          <ol className="space-y-3 list-decimal list-inside">
            {steps.map((step, i) => (
              <li key={i} className="text-xl text-bar-ink leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function RecipeModal({ order, onClose }: RecipeModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-bar-surface rounded-2xl border border-bar-border shadow-2xl p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-14 h-14 rounded-xl bg-bar-soft hover:bg-bar-soft text-white transition-colors"
          aria-label="Schließen"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-accent mb-4 pr-16">Rezept</h2>

        {order.items.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {order.items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i === activeIndex
                    ? "bg-accent text-white"
                    : "bg-bar-soft text-bar-muted hover:bg-bar-soft/50"
                }`}
              >
                {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.cocktail.name}
              </button>
            ))}
          </div>
        )}

        {order.items[activeIndex] && (
          <CocktailRecipe
            cocktail={order.items[activeIndex].cocktail as CocktailRecipeProps["cocktail"]}
            quantity={order.items[activeIndex].quantity}
            itemNote={order.items[activeIndex].itemNote}
          />
        )}
      </div>
    </div>
  );
}
