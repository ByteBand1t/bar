import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { CreateOrderSchema } from "@/lib/validations";
import { eventBus } from "@/lib/event-bus";
import type { OrderWithDetails } from "@/lib/event-bus";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte kurz warten." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 60000) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { guestName, guestTag, notes, items } = parsed.data;

  try {
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          guestName,
          guestTag,
          notes,
          items: {
            create: items.map((item) => ({
              cocktailId: item.cocktailId,
              quantity: item.quantity,
              itemNote: item.itemNote,
            })),
          },
        },
        include: { items: { include: { cocktail: true } } },
      });

      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          action: "created",
          toState: "new",
          actor: "guest",
        },
      });

      return created;
    });

    eventBus.publish("order.created", order as OrderWithDetails);
    console.info(JSON.stringify({ event: "order_created", orderId: order.id, ip }));
    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "/api/orders", err: String(err) }));
    return NextResponse.json({ error: "Bestellung konnte nicht gespeichert werden" }, { status: 500 });
  }
}
