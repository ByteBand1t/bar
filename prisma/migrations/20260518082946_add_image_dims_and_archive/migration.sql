-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cocktail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageFilename" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "category" TEXT NOT NULL,
    "isAlcoholFree" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "prepTimeMin" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Cocktail" ("category", "createdAt", "description", "id", "imageFilename", "ingredients", "isAlcoholFree", "isAvailable", "name", "prepTimeMin", "sortOrder", "steps", "updatedAt") SELECT "category", "createdAt", "description", "id", "imageFilename", "ingredients", "isAlcoholFree", "isAvailable", "name", "prepTimeMin", "sortOrder", "steps", "updatedAt" FROM "Cocktail";
DROP TABLE "Cocktail";
ALTER TABLE "new_Cocktail" RENAME TO "Cocktail";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
