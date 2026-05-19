import { db } from "@/lib/db";
import { buildDump } from "@/lib/dump";

export const dynamic = "force-dynamic";

export async function GET() {
  const dump = await buildDump(db);
  const stamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "");
  return new Response(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=bar-export-${stamp}.json`,
    },
  });
}
