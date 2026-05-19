import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await db.orderEvent.findMany({
    orderBy: { createdAt: "asc" },
  });

  const rows = events.map((e) => [
    e.id,
    e.orderId,
    e.action,
    e.fromState,
    e.toState,
    e.actor,
    e.metadata,
    e.createdAt,
  ]);

  const csv = toCsv(
    ["id", "orderId", "action", "fromState", "toState", "actor", "metadata", "createdAt"],
    rows
  );

  return csvResponse("events.csv", csv);
}
