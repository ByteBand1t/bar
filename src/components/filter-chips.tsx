"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

interface Category {
  value: string;
  label: string;
}

function Chips({ categories, active }: { categories: Category[]; active: string }) {
  const searchParams = useSearchParams();

  return (
    <div className="flex gap-2 overflow-x-auto py-3 pb-4 -mx-4 px-4 scrollbar-none">
      {categories.map((cat) => {
        const params = new URLSearchParams(searchParams.toString());
        if (cat.value === "all") {
          params.delete("category");
        } else {
          params.set("category", cat.value);
        }
        const isActive =
          cat.value === "all" ? active === "all" || !active : active === cat.value;

        return (
          <Link
            key={cat.value}
            href={`/?${params.toString()}`}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              isActive
                ? "bg-amber-500 text-slate-900"
                : "bg-purple-900/50 text-purple-200 hover:bg-purple-800/70 border border-purple-700/50"
            )}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}

export function FilterChips({ categories, active }: { categories: Category[]; active: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-2 overflow-x-auto py-3 pb-4 -mx-4 px-4">
          {categories.map((cat) => (
            <span
              key={cat.value}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-purple-900/50 text-purple-200"
            >
              {cat.label}
            </span>
          ))}
        </div>
      }
    >
      <Chips categories={categories} active={active} />
    </Suspense>
  );
}
