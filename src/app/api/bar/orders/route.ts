import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "active";

  try {
    if (status === "active") {
      const orders = await db.order.findMany({
        where: { status: { in: ["new", "in_progress", "ready"] } },
        orderBy: { createdAt: "asc" },
        include: { items: { include: { cocktail: true } } },
      });
      return NextResponse.json(orders);
    }

    if (status === "completed") {
      const orders = await db.order.findMany({
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        include: { items: { include: { cocktail: true } } },
      });
      return NextResponse.json(orders);
    }

    if (status === "cancelled") {
      const orders = await db.order.findMany({
        where: { status: "cancelled" },
        orderBy: { updatedAt: "desc" },
        include: { items: { include: { cocktail: true } } },
      });
      return NextResponse.json(orders);
    }

    if (status === "all") {
      const [active, done, cancelled] = await Promise.all([
        db.order.findMany({
          where: { status: { in: ["new", "in_progress", "ready"] } },
          orderBy: { createdAt: "asc" },
          include: { items: { include: { cocktail: true } } },
        }),
        db.order.findMany({
          where: { status: "completed" },
          orderBy: { completedAt: "desc" },
          include: { items: { include: { cocktail: true } } },
        }),
        db.order.findMany({
          where: { status: "cancelled" },
          orderBy: { updatedAt: "desc" },
          include: { items: { include: { cocktail: true } } },
        }),
      ]);
      return NextResponse.json([...active, ...done, ...cancelled]);
    }

    return NextResponse.json({ error: "Ungültiger status-Parameter" }, { status: 400 });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "/api/bar/orders", err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
