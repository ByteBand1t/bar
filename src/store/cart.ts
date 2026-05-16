"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  cocktailId: string;
  name: string;
  quantity: number;
  itemNote?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (cocktailId: string, name: string) => void;
  removeItem: (cocktailId: string) => void;
  updateQuantity: (cocktailId: string, quantity: number) => void;
  updateNote: (cocktailId: string, note: string) => void;
  clearCart: () => void;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (cocktailId, name) =>
        set((state) => {
          const existing = state.items.find((i) => i.cocktailId === cocktailId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cocktailId === cocktailId ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { cocktailId, name, quantity: 1 }] };
        }),

      removeItem: (cocktailId) =>
        set((state) => ({ items: state.items.filter((i) => i.cocktailId !== cocktailId) })),

      updateQuantity: (cocktailId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.cocktailId !== cocktailId)
              : state.items.map((i) => (i.cocktailId === cocktailId ? { ...i, quantity } : i)),
        })),

      updateNote: (cocktailId, note) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.cocktailId === cocktailId ? { ...i, itemNote: note } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "bar-cart" }
  )
);
