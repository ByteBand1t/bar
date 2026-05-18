import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const Schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler" }, { status: 422 });
    }

    const { ids } = parsed.data;

    await db.$transaction(
      ids.map((id, index) =>
        db.cocktail.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "POST /api/admin/cocktails/reorder", err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
