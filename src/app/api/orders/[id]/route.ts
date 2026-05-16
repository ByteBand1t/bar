import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { cocktail: { select: { name: true, imageFilename: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `/api/orders/${id}`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
