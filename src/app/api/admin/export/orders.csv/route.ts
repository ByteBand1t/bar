import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "asc" },
    include: { items: { select: { quantity: true } } },
  });

  const rows = orders.map((o) => {
    const itemCount = o.items.length;
    const drinkCount = o.items.reduce((s, i) => s + i.quantity, 0);
    const waitTimeSec =
      o.completedAt
        ? Math.max(
            0,
            Math.floor(
              (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) /
                1000
            )
          )
        : "";
    return [
      o.id,
      o.guestName,
      o.guestTag,
      o.status,
      o.cancelReason,
      o.notes,
      o.createdAt,
      o.completedAt,
      waitTimeSec,
      itemCount,
      drinkCount,
    ];
  });

  const csv = toCsv(
    [
      "id",
      "guestName",
      "guestTag",
      "status",
      "cancelReason",
      "notes",
      "createdAt",
      "completedAt",
      "waitTimeSec",
      "itemCount",
      "drinkCount",
    ],
    rows
  );

  return csvResponse("orders.csv", csv);
}
