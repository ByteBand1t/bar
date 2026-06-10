import { db } from "@/lib/db";
import { CocktailCard } from "@/components/cocktail-card";
import { CartIconLink } from "@/components/cart-icon-link";
import { CartFab } from "@/components/cart-fab";
import { Toaster } from "@/components/ui/toast";
import { FilterChips } from "@/components/filter-chips";
import { GuestLive } from "@/components/guest-live";
import type { Cocktail } from "@/types/cocktail";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "all", label: "Alle" },
  { value: "cocktail", label: "Cocktails" },
  { value: "longdrink", label: "Longdrinks" },
  { value: "softdrink", label: "Softdrinks" },
  { value: "beer", label: "Bier" },
  { value: "wine", label: "Wein" },
  { value: "shot", label: "Shots" },
  { value: "alcoholfree", label: "Alkoholfrei" },
];

async function getCocktails(): Promise<Cocktail[]> {
  const cocktails = await db.cocktail.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return cocktails.map((c) => ({
    ...c,
    ingredients: c.ingredients as unknown as Cocktail["ingredients"],
    steps: c.steps as unknown as string[],
  }));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const cocktails = await getCocktails();

  const filtered = cocktails.filter((c) => {
    if (category === "all") return true;
    if (category === "alcoholfree") return c.isAlcoholFree;
    return c.category === category;
  });

  return (
    <div className="flex flex-1 flex-col bg-guest-bg text-guest-ink">
      <GuestLive />
      <header className="sticky top-0 z-30 border-b border-guest-border bg-guest-surface/85 px-4 py-3 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold leading-tight text-guest-ink">
              Franzis Geburtstags-Bar <span aria-hidden>🍹</span>
            </h1>
            <p className="text-xs text-guest-muted">
              {cocktails.length} Getränke zur Auswahl
            </p>
          </div>
          <CartIconLink />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-28">
        <FilterChips categories={CATEGORIES} active={category} />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-guest-muted">
            <div className="text-4xl mb-3">🍸</div>
            <p>Keine Getränke in dieser Kategorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-1 sm:grid-cols-3">
            {filtered.map((cocktail) => (
              <CocktailCard key={cocktail.id} cocktail={cocktail} />
            ))}
          </div>
        )}
      </main>

      <CartFab />
      <Toaster theme="guest" />
    </div>
  );
}
