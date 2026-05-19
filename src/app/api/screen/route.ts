import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOverviewStats, getTopGuests } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** Public, intentionally minimal: first names, counts, no notes/tags. */
export async function GET() {
  const [overview, topGuests, recent] = await Promise.all([
    getOverviewStats(),
    getTopGuests(8),
    db.order.findMany({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id: true,
        guestName: true,
        completedAt: true,
        items: { select: { cocktail: { select: { name: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    totalDrinks: overview.totalDrinks,
    avgWaitTimeSec: overview.avgWaitTimeSec,
    activeOrders: overview.activeOrders,
    topGuests: topGuests.map((g) => ({
      guestName: g.guestName,
      drinkCount: g.drinkCount,
    })),
    recent: recent.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      drink: r.items[0]?.cocktail.name ?? "Getränk",
    })),
  });
}
