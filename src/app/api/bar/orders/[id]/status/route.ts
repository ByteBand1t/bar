import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";
import type { OrderWithDetails } from "@/lib/event-bus";

const BodySchema = z.object({
  status: z.enum(["in_progress", "ready", "completed"]),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ["in_progress", "completed"],
  in_progress: ["ready", "completed"],
  ready: ["completed"],
};

export async function PATCH(
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

  const { status: newStatus } = parsed.data;

  try {
    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Übergang von ${order.status} zu ${newStatus} nicht erlaubt` },
        { status: 422 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
        },
        include: { items: { include: { cocktail: true } } },
      });

      await tx.orderEvent.create({
        data: {
          orderId: id,
          action: "status_changed",
          fromState: order.status,
          toState: newStatus,
          actor: "bar",
        },
      });

      return o;
    });

    const eventType =
      newStatus === "completed"
        ? "order.completed"
        : "order.updated";

    eventBus.publish(eventType, updated as OrderWithDetails);
    console.info(JSON.stringify({ event: "order_status_changed", orderId: id, from: order.status, to: newStatus }));

    return NextResponse.json(updated);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `/api/bar/orders/${id}/status`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
