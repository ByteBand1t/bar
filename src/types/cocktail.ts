export interface Ingredient {
  name: string;
  amount: string;
}

export interface Cocktail {
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
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  cocktailId: string;
  quantity: number;
  itemNote: string | null;
  cocktail: {
    name: string;
    imageFilename: string | null;
  };
}

export interface Order {
  id: string;
  guestName: string;
  guestTag: string | null;
  status: "new" | "in_progress" | "ready" | "completed" | "cancelled";
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: OrderItem[];
}
