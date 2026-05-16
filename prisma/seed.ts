import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:/data/app.db";
const adapter = new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

const cocktails = [
  {
    name: "Mojito",
    description:
      "Der Klassiker aus Kuba – frische Minze, spritzige Limette und ein Hauch Rum. Erfrischend und belebend.",
    imageFilename: "placeholder-mojito.png",
    category: "cocktail",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 1,
    prepTimeMin: 5,
    ingredients: [
      { name: "Weißer Rum", amount: "5 cl" },
      { name: "Limettensaft", amount: "3 cl" },
      { name: "Zuckersirup", amount: "2 cl" },
      { name: "Frische Minze", amount: "10 Blätter" },
      { name: "Sodawasser", amount: "auffüllen" },
      { name: "Crushed Ice", amount: "nach Bedarf" },
    ],
    steps: [
      "Minze und Zuckersirup im Glas leicht anstößen",
      "Limettensaft hinzufügen",
      "Mit Crushed Ice füllen",
      "Rum dazugeben und kurz umrühren",
      "Mit Sodawasser auffüllen",
      "Mit Minze und Limettenspalte garnieren",
    ],
  },
  {
    name: "Aperol Spritz",
    description:
      "Der unverwechselbare italienische Sommerdrink. Bitter-süß, spritzig und wunderschön orange.",
    imageFilename: "placeholder-aperol.png",
    category: "longdrink",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 2,
    prepTimeMin: 3,
    ingredients: [
      { name: "Aperol", amount: "6 cl" },
      { name: "Prosecco", amount: "9 cl" },
      { name: "Sodawasser", amount: "3 cl" },
      { name: "Eiswürfel", amount: "nach Bedarf" },
    ],
    steps: [
      "Großes Weinglas mit Eiswürfeln füllen",
      "Prosecco einfüllen",
      "Aperol hinzufügen",
      "Mit Sodawasser auffüllen",
      "Sanft umrühren",
      "Mit Orangenscheibe garnieren",
    ],
  },
  {
    name: "Gin Tonic",
    description:
      "Zeitlos elegant: hochwertiger Gin trifft auf Tonic Water. Herb, frisch und unglaublich vielseitig.",
    imageFilename: "placeholder-gintonic.png",
    category: "longdrink",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 3,
    prepTimeMin: 3,
    ingredients: [
      { name: "Gin", amount: "5 cl" },
      { name: "Premium Tonic Water", amount: "15 cl" },
      { name: "Eiswürfel", amount: "nach Bedarf" },
      { name: "Gurke oder Limette", amount: "zur Garnierung" },
    ],
    steps: [
      "Großes Glas mit Eiswürfeln füllen",
      "Gin über das Eis gießen",
      "Tonic Water langsam am Glasrand entlang einfüllen",
      "Einmal sanft umrühren",
      "Mit Gurke oder Limette garnieren",
    ],
  },
  {
    name: "Moscow Mule",
    description:
      "Der Ingwer-Kick! Vodka und Ingwerbier im Kupferbecher serviert – scharf, frisch und unvergesslich.",
    imageFilename: "placeholder-mule.png",
    category: "longdrink",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 4,
    prepTimeMin: 3,
    ingredients: [
      { name: "Vodka", amount: "5 cl" },
      { name: "Limettensaft", amount: "2 cl" },
      { name: "Ingwerbier", amount: "15 cl" },
      { name: "Eiswürfel", amount: "nach Bedarf" },
    ],
    steps: [
      "Kupferbecher (oder Glas) mit Eiswürfeln füllen",
      "Vodka und Limettensaft hinzufügen",
      "Mit Ingwerbier auffüllen",
      "Sanft umrühren",
      "Mit Limettenspalte garnieren",
    ],
  },
  {
    name: "Frucht-Limonade (alkoholfrei)",
    description:
      "Hausgemachte Limonade mit frischen Früchten, Minze und Sodawasser. Für alle, die frisch und alkoholfrei feiern möchten.",
    imageFilename: "placeholder-limo.png",
    category: "softdrink",
    isAlcoholFree: true,
    isAvailable: true,
    sortOrder: 5,
    prepTimeMin: 4,
    ingredients: [
      { name: "Frische Beeren (Erdbeere/Himbeere)", amount: "8–10 Stück" },
      { name: "Zitronensaft", amount: "3 cl" },
      { name: "Zuckersirup", amount: "2 cl" },
      { name: "Minze", amount: "5 Blätter" },
      { name: "Sodawasser", amount: "auffüllen" },
      { name: "Crushed Ice", amount: "nach Bedarf" },
    ],
    steps: [
      "Beeren und Minze im Glas leicht zerdrücken",
      "Zitronensaft und Zuckersirup hinzufügen",
      "Mit Crushed Ice füllen",
      "Mit Sodawasser auffüllen",
      "Sanft umrühren und mit frischen Beeren garnieren",
    ],
  },
  {
    name: "Kühles Bier",
    description:
      "Ein frisch gezapftes Bier – oder kalt aus der Flasche. Der ehrlichste Durst-Löscher der Party.",
    imageFilename: "placeholder-bier.png",
    category: "beer",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 6,
    prepTimeMin: 1,
    ingredients: [{ name: "Bier (0,5 l)", amount: "1 Flasche oder Dose" }],
    steps: ["Kalt servieren", "Genießen"],
  },
  {
    name: "Roséwein",
    description:
      "Trockener, fruchtiger Roséwein – leicht gekühlt serviert. Elegant und unaufgeregt.",
    imageFilename: "placeholder-wein.png",
    category: "wine",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 7,
    prepTimeMin: 1,
    ingredients: [{ name: "Roséwein", amount: "15 cl" }],
    steps: ["Im Weinglas servieren", "Leicht gekühlt (8–10 °C)"],
  },
  {
    name: "Tequila Shot",
    description:
      "Der klassische Shot mit Salz und Limette. Für alle, die das Tanzbein schwingen wollen.",
    imageFilename: "placeholder-shot.png",
    category: "shot",
    isAlcoholFree: false,
    isAvailable: true,
    sortOrder: 8,
    prepTimeMin: 1,
    ingredients: [
      { name: "Tequila (Blanco)", amount: "4 cl" },
      { name: "Salz", amount: "eine Prise" },
      { name: "Limettenspalte", amount: "1 Stück" },
    ],
    steps: [
      "Salz auf den Handrücken geben",
      "Tequila einschenken",
      "Salz lecken, Tequila trinken, auf Limette beißen",
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  await db.orderEvent.deleteMany({});
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.cocktail.deleteMany({});

  for (const cocktail of cocktails) {
    await db.cocktail.create({ data: cocktail });
  }

  console.log(`Seeded ${cocktails.length} cocktails.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
