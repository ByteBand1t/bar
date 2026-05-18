import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const IMAGES_DIR = "/data/images";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const original = await db.cocktail.findUnique({ where: { id } });
    if (!original) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    let newImageFilename: string | null = null;

    // Copy image file if exists
    if (original.imageFilename) {
      const srcPath = path.join(IMAGES_DIR, original.imageFilename);
      const ext = path.extname(original.imageFilename);
      newImageFilename = `${randomUUID().replace(/-/g, "")}${ext}`;
      const destPath = path.join(IMAGES_DIR, newImageFilename);
      try {
        await fs.copyFile(srcPath, destPath);
      } catch {
        newImageFilename = null;
      }
    }

    const maxOrder = await db.cocktail.aggregate({ _max: { sortOrder: true } });
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    const duplicate = await db.cocktail.create({
      data: {
        name: `${original.name} (Kopie)`,
        description: original.description,
        category: original.category,
        isAlcoholFree: original.isAlcoholFree,
        isAvailable: false,
        isArchived: false,
        ingredients: original.ingredients as object[],
        steps: original.steps as string[],
        prepTimeMin: original.prepTimeMin,
        imageFilename: newImageFilename,
        imageWidth: newImageFilename ? original.imageWidth : null,
        imageHeight: newImageFilename ? original.imageHeight : null,
        sortOrder: nextOrder,
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `POST /api/admin/cocktails/${id}/duplicate`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
