import { EventEmitter } from "events";

export interface OrderCocktailDetails {
  id: string;
  name: string;
  imageFilename: string | null;
  ingredients: unknown;
  steps: unknown;
  prepTimeMin: number | null;
  description?: string;
  category?: string;
  isAlcoholFree?: boolean;
  isAvailable?: boolean;
}

export interface OrderItemWithDetails {
  id: string;
  orderId: string;
  cocktailId: string;
  quantity: number;
  itemNote: string | null;
  cocktail: OrderCocktailDetails;
}

export interface OrderWithDetails {
  id: string;
  guestName: string;
  guestTag: string | null;
  status: string;
  cancelReason: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt: Date | string | null;
  items: OrderItemWithDetails[];
}

export type BarEventType =
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "order.completed";

export interface BarEvent {
  type: BarEventType;
  payload: OrderWithDetails;
}

type EventHandler = (event: BarEvent) => void;

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  publish(type: BarEventType, payload: OrderWithDetails) {
    this.emitter.emit("bar-event", { type, payload });
  }

  subscribe(handler: EventHandler): () => void {
    this.emitter.on("bar-event", handler);
    return () => this.emitter.off("bar-event", handler);
  }
}

const globalForBus = globalThis as unknown as { barEventBus?: EventBus };

export const eventBus = globalForBus.barEventBus ?? new EventBus();

if (process.env.NODE_ENV !== "production") {
  globalForBus.barEventBus = eventBus;
}
