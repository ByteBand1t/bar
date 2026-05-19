import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await db.orderItem.findMany({
    include: {
      cocktail: { select: { name: true } },
      order: { select: { createdAt: true, status: true } },
    },
  });

  const rows = items.map((it) => [
    it.id,
    it.orderId,
    it.cocktailId,
    it.cocktail.name,
    it.quantity,
    it.itemNote,
    it.order.status,
    it.order.createdAt,
  ]);

  const csv = toCsv(
    [
      "id",
      "orderId",
      "cocktailId",
      "cocktailName",
      "quantity",
      "itemNote",
      "orderStatus",
      "orderCreatedAt",
    ],
    rows
  );

  return csvResponse("order-items.csv", csv);
}
