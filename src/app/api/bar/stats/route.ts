import { NextRequest, NextResponse } from "next/server";
import {
  getOverviewStats,
  getTopCocktails,
  getOrdersOverTime,
  getTopGuests,
  getCancelStats,
  getWaitTimeDistribution,
} from "@/lib/stats";
import { resolveRange } from "@/lib/stats-range";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { range } = resolveRange(searchParams.get("range"));
  const bucket = Number(searchParams.get("bucket")) || 15;

  const [overview, topCocktails, ordersOverTime, topGuests, cancels, waitDist] =
    await Promise.all([
      getOverviewStats(range),
      getTopCocktails(10, range),
      getOrdersOverTime(bucket, range),
      getTopGuests(10, range),
      getCancelStats(range),
      getWaitTimeDistribution(range),
    ]);

  return NextResponse.json({
    overview,
    topCocktails,
    ordersOverTime,
    topGuests,
    cancels,
    waitDist,
    generatedAt: new Date().toISOString(),
  });
}
