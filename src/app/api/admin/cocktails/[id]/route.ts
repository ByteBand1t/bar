import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CocktailSchema } from "@/lib/cocktail-schema";
import fs from "fs/promises";
import path from "path";

const IMAGES_DIR = "/data/images";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cocktail = await db.cocktail.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!cocktail) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(cocktail);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `GET /api/admin/cocktails/${id}`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existing = await db.cocktail.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    const body = await req.json();
    const parsed = CocktailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", issues: parsed.error.issues }, { status: 422 });
    }

    const oldImageFilename = existing.imageFilename;
    const newImageFilename = parsed.data.imageFilename ?? null;

    const updated = await db.cocktail.update({
      where: { id },
      data: {
        ...parsed.data,
        imageFilename: newImageFilename,
        imageWidth: parsed.data.imageWidth ?? null,
        imageHeight: parsed.data.imageHeight ?? null,
        prepTimeMin: parsed.data.prepTimeMin ?? null,
        ingredients: parsed.data.ingredients as object[],
        steps: parsed.data.steps,
      },
    });

    // Delete old image after successful DB update
    if (oldImageFilename && oldImageFilename !== newImageFilename) {
      const oldPath = path.join(IMAGES_DIR, oldImageFilename);
      fs.unlink(oldPath).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `PUT /api/admin/cocktails/${id}`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cocktail = await db.cocktail.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!cocktail) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    if (cocktail._count.orderItems > 0) {
      // Soft delete - cocktail has orders, just archive
      await db.cocktail.update({
        where: { id },
        data: { isAvailable: false, isArchived: true },
      });
      return NextResponse.json({ deleted: false, archived: true });
    }

    // Hard delete
    const filename = cocktail.imageFilename;
    await db.cocktail.delete({ where: { id } });

    if (filename) {
      const filePath = path.join(IMAGES_DIR, filename);
      fs.unlink(filePath).catch(() => {});
    }

    return NextResponse.json({ deleted: true, archived: false });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: `DELETE /api/admin/cocktails/${id}`, err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
