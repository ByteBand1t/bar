import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const IMAGES_DIR = "/data/images";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (filename.includes("/") || filename.includes("..") || filename.startsWith(".")) {
    return NextResponse.json({ error: "Ungültiger Dateiname" }, { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Nicht unterstütztes Format" }, { status: 400 });
  }

  const filePath = path.join(IMAGES_DIR, filename);

  try {
    const stat = await fs.stat(filePath);
    const etag = `"${crypto
      .createHash("sha1")
      .update(`${stat.mtimeMs}-${stat.size}`)
      .digest("hex")}"`;

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
      },
    });
  } catch {
    return NextResponse.json({ error: "Bild nicht gefunden" }, { status: 404 });
  }
}
