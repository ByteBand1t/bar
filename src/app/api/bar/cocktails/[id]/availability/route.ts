import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";
import { log } from "@/lib/logger";

const AvailabilitySchema = z.object({ isAvailable: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = AvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_input", message: "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const cocktail = await db.cocktail.update({
      where: { id },
      data: { isAvailable: parsed.data.isAvailable },
    });

    eventBus.publishSystem({
      type: "cocktail.availability_changed",
      payload: { id: cocktail.id, isAvailable: cocktail.isAvailable },
    });
    log.info("availability_changed", {
      route: `/api/bar/cocktails/${id}/availability`,
      status: 200,
      isAvailable: cocktail.isAvailable,
    });

    return NextResponse.json(cocktail);
  } catch (err) {
    log.error("api_error", {
      route: `/api/bar/cocktails/${id}/availability`,
      status: 500,
      err: String(err),
    });
    return NextResponse.json(
      { error: "server_error", message: "Interner Fehler" },
      { status: 500 }
    );
  }
}
