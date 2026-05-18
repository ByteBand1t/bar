import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CocktailSchema } from "@/lib/cocktail-schema";

export async function GET() {
  try {
    const cocktails = await db.cocktail.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { orderItems: true } } },
    });
    return NextResponse.json(cocktails);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "GET /api/admin/cocktails", err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CocktailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", issues: parsed.error.issues }, { status: 422 });
    }

    const maxOrder = await db.cocktail.aggregate({ _max: { sortOrder: true } });
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    const cocktail = await db.cocktail.create({
      data: {
        ...parsed.data,
        sortOrder: nextOrder,
        imageFilename: parsed.data.imageFilename ?? null,
        imageWidth: parsed.data.imageWidth ?? null,
        imageHeight: parsed.data.imageHeight ?? null,
        prepTimeMin: parsed.data.prepTimeMin ?? null,
        ingredients: parsed.data.ingredients as object[],
        steps: parsed.data.steps,
      },
    });
    return NextResponse.json(cocktail, { status: 201 });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "POST /api/admin/cocktails", err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
