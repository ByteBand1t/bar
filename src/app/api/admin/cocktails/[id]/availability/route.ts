import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { eventBus } from "@/lib/event-bus";

const Schema = z.object({ isAvailable: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler" }, { status: 422 });
    }

    const cocktail = await db.cocktail.update({
      where: { id },
      data: { isAvailable: parsed.data.isAvailable },
    });
    eventBus.publishSystem({
      type: "cocktail.availability_changed",
      payload: { id: cocktail.id, isAvailable: cocktail.isAvailable },
    });
    return NextResponse.json(cocktail);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `PATCH /api/admin/cocktails/${id}/availability`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
