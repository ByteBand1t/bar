import { db } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const cocktails = await db.cocktail.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const rows = cocktails.map((c) => [
    c.id,
    c.name,
    c.description,
    c.category,
    c.isAlcoholFree,
    c.isAvailable,
    c.isArchived,
    c.prepTimeMin,
    c.sortOrder,
    c.ingredients,
    c.steps,
    c.imageFilename,
    c.createdAt,
  ]);

  const csv = toCsv(
    [
      "id",
      "name",
      "description",
      "category",
      "isAlcoholFree",
      "isAvailable",
      "isArchived",
      "prepTimeMin",
      "sortOrder",
      "ingredients",
      "steps",
      "imageFilename",
      "createdAt",
    ],
    rows
  );

  return csvResponse("cocktails.csv", csv);
}
