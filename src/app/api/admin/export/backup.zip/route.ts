import archiver from "archiver";
import Database from "better-sqlite3";
import { Readable } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { db } from "@/lib/db";
import { buildDump } from "@/lib/dump";
import { getDbPath, IMAGES_DIR } from "@/lib/paths";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dump = await buildDump(db);

  // Consistent binary DB copy (NOT a raw file copy of the live DB).
  const tmpDb = path.join(os.tmpdir(), `bar-backup-${Date.now()}.db`);
  try {
    const src = new Database(getDbPath(), { readonly: true, fileMustExist: true });
    await src.backup(tmpDb);
    src.close();
  } catch (err) {
    log.error("backup_db_failed", {
      route: "/api/admin/export/backup.zip",
      status: 500,
      err: String(err),
    });
    return new Response(
      JSON.stringify({ error: "backup_failed", message: "DB-Backup fehlgeschlagen" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.append(JSON.stringify(dump, null, 2), { name: "dump.json" });
  archive.file(tmpDb, { name: "db/app.db" });
  if (fs.existsSync(IMAGES_DIR)) {
    archive.directory(IMAGES_DIR, "images");
  }

  const cleanup = () => fs.promises.unlink(tmpDb).catch(() => {});
  archive.on("end", cleanup);
  archive.on("error", cleanup);

  archive.finalize();

  const stamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "");

  const webStream = Readable.toWeb(archive) as unknown as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=bar-backup-${stamp}.zip`,
    },
  });
}
