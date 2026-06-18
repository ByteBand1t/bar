import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CocktailForm } from "@/components/admin/cocktail-form";

export const metadata: Metadata = { title: "Admin – Cocktail bearbeiten" };

export default async function EditCocktailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cocktail = await db.cocktail.findUnique({ where: { id } });
  if (!cocktail) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-admin-muted hover:text-accent transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-admin-ink">Cocktail bearbeiten</h1>
      </div>
      <CocktailForm
        id={id}
        defaultValues={{
          name: cocktail.name,
          category: cocktail.category,
          description: cocktail.description,
          imageFilename: cocktail.imageFilename,
          imageWidth: cocktail.imageWidth,
          imageHeight: cocktail.imageHeight,
          isAlcoholFree: cocktail.isAlcoholFree,
          isAvailable: cocktail.isAvailable,
          prepTimeMin: cocktail.prepTimeMin,
          ingredients: cocktail.ingredients as Array<{ name: string; amount: string }>,
          steps: cocktail.steps as string[],
        }}
      />
    </div>
  );
}
