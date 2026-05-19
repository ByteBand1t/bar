import { db } from "@/lib/db";

export interface TimeRange {
  since?: Date;
  until?: Date;
}

function createdAtFilter(range?: TimeRange) {
  if (!range || (!range.since && !range.until)) return {};
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (range.since) createdAt.gte = range.since;
  if (range.until) createdAt.lte = range.until;
  return { createdAt };
}

export interface OverviewStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  totalDrinks: number;
  avgWaitTimeSec: number;
  medianWaitTimeSec: number;
  longestWaitSec: number;
  ordersLastHour: number;
}

export async function getOverviewStats(range?: TimeRange): Promise<OverviewStats> {
  const where = createdAtFilter(range);
  const orders = await db.order.findMany({
    where,
    select: {
      status: true,
      createdAt: true,
      completedAt: true,
      items: { select: { quantity: true } },
    },
  });

  let completedOrders = 0;
  let cancelledOrders = 0;
  let activeOrders = 0;
  let totalDrinks = 0;
  const waitTimes: number[] = [];
  const hourAgo = Date.now() - 60 * 60_000;
  let ordersLastHour = 0;

  for (const o of orders) {
    const drinks = o.items.reduce((s, i) => s + i.quantity, 0);
    if (o.status === "completed") {
      completedOrders++;
      totalDrinks += drinks;
      if (o.completedAt) {
        const sec = Math.max(
          0,
          Math.floor(
            (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) / 1000
          )
        );
        waitTimes.push(sec);
      }
    } else if (o.status === "cancelled") {
      cancelledOrders++;
    } else {
      activeOrders++;
    }
    if (new Date(o.createdAt).getTime() >= hourAgo && o.status !== "cancelled") {
      ordersLastHour++;
    }
  }

  waitTimes.sort((a, b) => a - b);
  const avgWaitTimeSec = waitTimes.length
    ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
    : 0;
  const medianWaitTimeSec = waitTimes.length
    ? waitTimes[Math.floor(waitTimes.length / 2)]
    : 0;
  const longestWaitSec = waitTimes.length ? waitTimes[waitTimes.length - 1] : 0;

  return {
    totalOrders: orders.length,
    completedOrders,
    cancelledOrders,
    activeOrders,
    totalDrinks,
    avgWaitTimeSec,
    medianWaitTimeSec,
    longestWaitSec,
    ordersLastHour,
  };
}

export interface TopCocktail {
  cocktailId: string;
  name: string;
  imageFilename: string | null;
  totalQty: number;
}

export async function getTopCocktails(
  limit = 10,
  range?: TimeRange
): Promise<TopCocktail[]> {
  const items = await db.orderItem.findMany({
    where: { order: { status: "completed", ...createdAtFilter(range) } },
    select: {
      quantity: true,
      cocktailId: true,
      cocktail: { select: { name: true, imageFilename: true } },
    },
  });

  const map = new Map<string, TopCocktail>();
  for (const it of items) {
    const cur = map.get(it.cocktailId) ?? {
      cocktailId: it.cocktailId,
      name: it.cocktail.name,
      imageFilename: it.cocktail.imageFilename,
      totalQty: 0,
    };
    cur.totalQty += it.quantity;
    map.set(it.cocktailId, cur);
  }

  return [...map.values()]
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, limit);
}

export interface TimeBucket {
  bucketStart: Date;
  count: number;
  drinkCount: number;
}

export async function getOrdersOverTime(
  bucketMinutes = 15,
  range?: TimeRange
): Promise<TimeBucket[]> {
  const orders = await db.order.findMany({
    where: { status: { not: "cancelled" }, ...createdAtFilter(range) },
    select: { createdAt: true, items: { select: { quantity: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (orders.length === 0) return [];

  const bucketMs = bucketMinutes * 60_000;
  const buckets = new Map<number, TimeBucket>();

  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    const bucketKey = Math.floor(t / bucketMs) * bucketMs;
    const drinks = o.items.reduce((s, i) => s + i.quantity, 0);
    const b = buckets.get(bucketKey) ?? {
      bucketStart: new Date(bucketKey),
      count: 0,
      drinkCount: 0,
    };
    b.count += 1;
    b.drinkCount += drinks;
    buckets.set(bucketKey, b);
  }

  return [...buckets.values()].sort(
    (a, b) => a.bucketStart.getTime() - b.bucketStart.getTime()
  );
}

export interface TopGuest {
  guestName: string;
  orderCount: number;
  drinkCount: number;
}

export async function getTopGuests(
  limit = 10,
  range?: TimeRange
): Promise<TopGuest[]> {
  const orders = await db.order.findMany({
    where: { status: "completed", ...createdAtFilter(range) },
    select: { guestName: true, items: { select: { quantity: true } } },
  });

  const map = new Map<string, TopGuest>();
  for (const o of orders) {
    const key = o.guestName.trim().toLowerCase();
    const cur = map.get(key) ?? {
      guestName: o.guestName.trim(),
      orderCount: 0,
      drinkCount: 0,
    };
    cur.orderCount += 1;
    cur.drinkCount += o.items.reduce((s, i) => s + i.quantity, 0);
    map.set(key, cur);
  }

  return [...map.values()]
    .sort((a, b) => b.drinkCount - a.drinkCount || b.orderCount - a.orderCount)
    .slice(0, limit);
}

export interface CancelStats {
  totalCancelled: number;
  byReason: Array<{ reason: string; count: number }>;
}

export async function getCancelStats(range?: TimeRange): Promise<CancelStats> {
  const orders = await db.order.findMany({
    where: { status: "cancelled", ...createdAtFilter(range) },
    select: { cancelReason: true },
  });

  const map = new Map<string, number>();
  for (const o of orders) {
    const reason = o.cancelReason?.trim() || "Ohne Angabe";
    map.set(reason, (map.get(reason) ?? 0) + 1);
  }

  return {
    totalCancelled: orders.length,
    byReason: [...map.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export type WaitBucket = "0-2min" | "2-5min" | "5-10min" | "10+min";

export async function getWaitTimeDistribution(
  range?: TimeRange
): Promise<Array<{ bucket: WaitBucket; count: number }>> {
  const orders = await db.order.findMany({
    where: {
      status: "completed",
      completedAt: { not: null },
      ...createdAtFilter(range),
    },
    select: { createdAt: true, completedAt: true },
  });

  const counts: Record<WaitBucket, number> = {
    "0-2min": 0,
    "2-5min": 0,
    "5-10min": 0,
    "10+min": 0,
  };

  for (const o of orders) {
    const sec =
      (new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime()) / 1000;
    if (sec < 120) counts["0-2min"]++;
    else if (sec < 300) counts["2-5min"]++;
    else if (sec < 600) counts["5-10min"]++;
    else counts["10+min"]++;
  }

  return (Object.keys(counts) as WaitBucket[]).map((bucket) => ({
    bucket,
    count: counts[bucket],
  }));
}
