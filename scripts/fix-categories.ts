import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:/data/app.db";
const adapter = new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

const CATEGORY_MAP: Record<string, string> = {
  cocktail: "Cocktail",
  cocktails: "Cocktail",
  longdrink: "Longdrink",
  longdrinks: "Longdrink",
  softdrink: "Softdrink",
  softdrinks: "Softdrink",
  beer: "Bier",
  bier: "Bier",
  wine: "Wein",
  wein: "Wein",
  sparkling: "Sekt",
  sekt: "Sekt",
  shot: "Shot",
  shots: "Shot",
  coffee: "Kaffee",
  kaffee: "Kaffee",
};

async function main() {
  let updated = 0;
  for (const [oldCategory, category] of Object.entries(CATEGORY_MAP)) {
    const result = await db.cocktail.updateMany({ where: { category: oldCategory }, data: { category } });
    updated += result.count;
  }
  console.log(`Updated ${updated} cocktail category value(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
