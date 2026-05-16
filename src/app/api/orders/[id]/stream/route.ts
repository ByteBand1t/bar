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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { cocktail: true } } },
  });

  if (!order) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };

  const isTerminal = (status: string) =>
    status === "completed" || status === "cancelled";

  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSSE("order.current", order));

      if (isTerminal(order.status)) {
        closeTimer = setTimeout(() => {
          try { controller.close(); } catch {}
        }, 5 * 60 * 1000);
      }

      const unsubscribe = eventBus.subscribe((event) => {
        if (event.payload.id !== id) return;
        try {
          controller.enqueue(encodeSSE(event.type, event.payload));
        } catch {}

        if (isTerminal(event.payload.status) && !closeTimer) {
          closeTimer = setTimeout(() => {
            try { controller.close(); } catch {}
          }, 5 * 60 * 1000);
        }
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
        if (closeTimer) clearTimeout(closeTimer);
        unsubscribe();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, { headers });
}
