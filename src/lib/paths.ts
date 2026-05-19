export const IMAGES_DIR = process.env.IMAGES_DIR ?? "/data/images";

/** Resolves the SQLite file path from DATABASE_URL (file: URL or raw path). */
export function getDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:/data/app.db";
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}
