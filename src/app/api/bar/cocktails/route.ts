import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const cocktails = await db.cocktail.findMany({
    where: { isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, imageFilename: true, isAvailable: true },
  });
  return NextResponse.json(cocktails);
}
