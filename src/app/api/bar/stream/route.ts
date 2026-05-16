import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

function encodeSSE(event: string, data: unknown): Uint8Array {
  const json = JSON.stringify(data);
  const msg = `event: ${event}\ndata: ${json}\n\n`;
  return new TextEncoder().encode(msg);
}

function encodeHeartbeat(): Uint8Array {
  return new TextEncoder().encode(":\n\n");
}

export async function GET(req: NextRequest) {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };

  const activeOrders = await db.order.findMany({
    where: { status: { in: ["new", "in_progress", "ready"] } },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        include: { cocktail: true },
      },
    },
  });

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSSE("snapshot", activeOrders));

      const unsubscribe = eventBus.subscribe((event) => {
        try {
          controller.enqueue(encodeSSE(event.type, event.payload));
        } catch {}
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encodeHeartbeat());
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, { headers });
}
