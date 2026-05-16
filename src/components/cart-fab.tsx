"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

export function CartFab() {
  const totalItems = useCartStore((s) => s.totalItems());

  if (totalItems === 0) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-4 z-40 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-3 rounded-full shadow-lg shadow-amber-900/30 transition-all"
    >
      <ShoppingCart size={20} />
      <span>{totalItems} im Warenkorb</span>
    </Link>
  );
}
