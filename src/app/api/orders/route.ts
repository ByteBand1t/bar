import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { CreateOrderSchema } from "@/lib/validations";
import { eventBus } from "@/lib/event-bus";
import type { OrderWithDetails } from "@/lib/event-bus";
import { getBarState } from "@/lib/settings";
import { getIdempotentOrder, rememberIdempotentOrder } from "@/lib/idempotency";
import { log } from "@/lib/logger";
import { sendPushToAll } from "@/lib/push";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = getIp(req);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Zu viele Anfragen. Bitte kurz warten." },
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
    return NextResponse.json({ error: "invalid_json", message: "Ungültiges JSON" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_input",
        message: "Ungültige Eingabe",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { guestName, guestTag, notes, items, idempotencyKey } = parsed.data;

  if (idempotencyKey) {
    const existing = getIdempotentOrder(idempotencyKey);
    if (existing) {
      return NextResponse.json({ id: existing }, { status: 201 });
    }
  }

  const barState = await getBarState();
  if (!barState.acceptingOrders) {
    return NextResponse.json(
      {
        error: "bar_paused",
        message:
          barState.pauseMessage ?? "Die Bestellannahme ist gerade pausiert.",
      },
      { status: 409 }
    );
  }

  // Reject items whose cocktail is unavailable or archived.
  const cocktailIds = [...new Set(items.map((i) => i.cocktailId))];
  const cocktails = await db.cocktail.findMany({
    where: { id: { in: cocktailIds } },
    select: { id: true, isAvailable: true, isArchived: true },
  });
  const cocktailMap = new Map(cocktails.map((c) => [c.id, c]));
  const unavailableIds = cocktailIds.filter((id) => {
    const c = cocktailMap.get(id);
    return !c || !c.isAvailable || c.isArchived;
  });

  if (unavailableIds.length > 0) {
    return NextResponse.json(
      {
        error: "items_unavailable",
        message:
          "Manche Getränke sind nicht mehr verfügbar. Bitte aus dem Warenkorb entfernen.",
        unavailableIds,
      },
      { status: 409 }
    );
  }

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

    if (idempotencyKey) rememberIdempotentOrder(idempotencyKey, order.id);

    eventBus.publish("order.created", order as OrderWithDetails);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    void sendPushToAll(
      "🍹 Neue Bestellung",
      `${order.guestName} hat ${totalItems} ${totalItems === 1 ? "Getränk" : "Getränke"} bestellt`,
      { url: "/bar", orderId: order.id }
    ).catch((error) => log.error("push_send_failed", { orderId: order.id, err: String(error) }));
    log.info("order_created", {
      route: "/api/orders",
      status: 201,
      durationMs: Date.now() - start,
      orderId: order.id,
    });
    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (err) {
    log.error("api_error", {
      route: "/api/orders",
      status: 500,
      durationMs: Date.now() - start,
      err: String(err),
    });
    return NextResponse.json(
      { error: "server_error", message: "Bestellung konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}
