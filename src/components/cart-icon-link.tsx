"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

export function CartIconLink() {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center p-2 rounded-full text-accent hover:bg-accent-soft transition-colors"
      aria-label={`Warenkorb (${totalItems} Artikel)`}
    >
      <ShoppingCart size={24} />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-accent-fg text-xs font-bold rounded-full px-1">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
