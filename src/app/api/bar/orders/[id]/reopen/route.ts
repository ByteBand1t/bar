import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";
import type { OrderWithDetails } from "@/lib/event-bus";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
    }
    if (order.status !== "completed" && order.status !== "cancelled") {
      return NextResponse.json(
        { error: "Nur abgeschlossene oder stornierte Bestellungen können wiedereröffnet werden" },
        { status: 422 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id },
        data: { status: "new", cancelReason: null, completedAt: null },
        include: { items: { include: { cocktail: true } } },
      });

      await tx.orderEvent.create({
        data: {
          orderId: id,
          action: "reopened",
          fromState: order.status,
          toState: "new",
          actor: "bar",
        },
      });

      return o;
    });

    eventBus.publish("order.created", updated as OrderWithDetails);
    console.info(JSON.stringify({ event: "order_reopened", orderId: id }));

    return NextResponse.json(updated);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `/api/bar/orders/${id}/reopen`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
