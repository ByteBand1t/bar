import type { PrismaClient } from "@/generated/prisma/client";

export interface DbDump {
  exportedAt: string;
  schemaVersion: number;
  cocktails: unknown[];
  orders: unknown[];
  events: unknown[];
  settings: unknown[];
}

export async function buildDump(db: PrismaClient): Promise<DbDump> {
  const [cocktails, orders, events, settings] = await Promise.all([
    db.cocktail.findMany({ orderBy: { sortOrder: "asc" } }),
    db.order.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
    db.orderEvent.findMany({ orderBy: { createdAt: "asc" } }),
    db.barSetting.findMany(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    cocktails,
    orders,
    events,
    settings,
  };
}
