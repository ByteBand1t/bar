import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";
import type { OrderWithDetails } from "@/lib/event-bus";

const BodySchema = z.object({
  reason: z.string().min(1, "Grund ist erforderlich").max(200),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
    }
    if (order.status === "cancelled" || order.status === "completed") {
      return NextResponse.json(
        { error: "Bestellung kann nicht mehr storniert werden" },
        { status: 422 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id },
        data: { status: "cancelled", cancelReason: parsed.data.reason },
        include: { items: { include: { cocktail: true } } },
      });

      await tx.orderEvent.create({
        data: {
          orderId: id,
          action: "cancelled",
          fromState: order.status,
          toState: "cancelled",
          actor: "bar",
          metadata: { reason: parsed.data.reason },
        },
      });

      return o;
    });

    eventBus.publish("order.cancelled", updated as OrderWithDetails);
    console.info(JSON.stringify({ event: "order_cancelled", orderId: id }));

    return NextResponse.json(updated);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `/api/bar/orders/${id}/cancel`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
