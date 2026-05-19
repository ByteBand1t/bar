import { NextRequest } from "next/server";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

function sse(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: NextRequest) {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = eventBus.subscribe((event) => {
        // Only emit a sanitized hint; client refetches /api/screen.
        if (
          event.type === "order.completed" ||
          event.type === "order.created" ||
          event.type === "order.cancelled"
        ) {
          try {
            controller.enqueue(
              sse("refresh", {
                type: event.type,
                guestName: event.payload.guestName,
                drink: event.payload.items?.[0]?.cocktail?.name ?? "Getränk",
              })
            );
          } catch {}
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(":\n\n"));
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
