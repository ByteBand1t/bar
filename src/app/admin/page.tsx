import type { Metadata } from "next";
import { AdminCocktailList } from "./cocktail-list";

export const metadata: Metadata = { title: "Admin – Cocktails" };

export default function AdminPage() {
  return <AdminCocktailList />;
}
