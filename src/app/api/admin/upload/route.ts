import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const IMAGES_DIR = "/data/images";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Kein Bild hochgeladen" }, { status: 400 });
    }

    // Check size before processing
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Datei zu groß (max. 10 MB)" }, { status: 413 });
    }

    // Check MIME type from Content-Type
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Nicht unterstütztes Format (JPEG, PNG oder WebP erlaubt)" },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import sharp to avoid edge runtime issues
    const sharp = (await import("sharp")).default;

    let metadata: { width?: number; height?: number };
    let outputBuffer: Buffer;

    try {
      const pipeline = sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 });

      outputBuffer = await pipeline.toBuffer();
      const sharpMeta = await sharp(outputBuffer).metadata();
      metadata = { width: sharpMeta.width, height: sharpMeta.height };
    } catch {
      return NextResponse.json({ error: "Bild konnte nicht verarbeitet werden" }, { status: 422 });
    }

    const filename = `${randomUUID().replace(/-/g, "")}.webp`;
    const outputPath = path.join(IMAGES_DIR, filename);

    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.writeFile(outputPath, outputBuffer);

    return NextResponse.json({
      filename,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      sizeBytes: outputBuffer.length,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: "api_error", route: "POST /api/admin/upload", err: String(err) }));
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
