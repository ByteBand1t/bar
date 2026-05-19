import type { Metadata } from "next";
import {
  getOverviewStats,
  getTopCocktails,
  getOrdersOverTime,
  getTopGuests,
  getCancelStats,
  getWaitTimeDistribution,
} from "@/lib/stats";
import { resolveRange } from "@/lib/stats-range";
import { StatsDashboard } from "./stats-dashboard";

export const metadata: Metadata = { title: "Statistik – Bar" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { range } = resolveRange("today");
  const [overview, topCocktails, ordersOverTime, topGuests, cancels, waitDist] =
    await Promise.all([
      getOverviewStats(range),
      getTopCocktails(10, range),
      getOrdersOverTime(15, range),
      getTopGuests(10, range),
      getCancelStats(range),
      getWaitTimeDistribution(range),
    ]);

  const initial = {
    overview,
    topCocktails,
    ordersOverTime: ordersOverTime.map((b) => ({
      bucketStart: b.bucketStart.toISOString(),
      count: b.count,
      drinkCount: b.drinkCount,
    })),
    topGuests,
    cancels,
    waitDist,
    generatedAt: new Date().toISOString(),
  };

  return <StatsDashboard initial={initial} />;
}
