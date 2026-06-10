import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CocktailForm } from "@/components/admin/cocktail-form";

export const metadata: Metadata = { title: "Admin – Neuer Cocktail" };

export default function NewCocktailPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-admin-muted hover:text-accent transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-admin-ink">Neuer Cocktail</h1>
      </div>
      <CocktailForm />
    </div>
  );
}
