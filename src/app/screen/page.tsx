import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getOverviewStats, getTopGuests } from "@/lib/stats";
import { ScreenView } from "./screen-view";

export const metadata: Metadata = { title: "Franzis Geburtstags-Bar" };
export const dynamic = "force-dynamic";

export default async function ScreenPage() {
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
        items: { select: { cocktail: { select: { name: true } } } },
      },
    }),
  ]);

  const initial = {
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
  };

  return <ScreenView initial={initial} />;
}
