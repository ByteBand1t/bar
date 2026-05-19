import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";
import { IMAGES_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    db: "error",
    eventBus: "error",
    images: "error",
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch {}

  try {
    if (typeof eventBus.subscribe === "function") checks.eventBus = "ok";
  } catch {}

  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    const probe = path.join(IMAGES_DIR, `.health-${Date.now()}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    checks.images = "ok";
  } catch {}

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: healthy ? "ok" : "error", checks },
    { status: healthy ? 200 : 503 }
  );
}
