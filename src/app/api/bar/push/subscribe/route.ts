import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

function authError(error: unknown) {
  if (error instanceof Response) return error;
  return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("bar");
  } catch (error) {
    return authError(error);
  }

  const parsed = PushSubscriptionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Push-Subscription" }, { status: 400 });
  }

  await db.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: { keys: parsed.data.keys },
    create: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole("bar");
  } catch (error) {
    return authError(error);
  }

  const parsed = z.object({ endpoint: z.string().url() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Push-Subscription" }, { status: 400 });
  }

  await db.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } });
  return NextResponse.json({ ok: true });
}
