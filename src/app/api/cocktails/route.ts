import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cocktails = await db.cocktail.findMany({
      where: { isAvailable: true, isArchived: false },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(cocktails);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "/api/cocktails", err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
