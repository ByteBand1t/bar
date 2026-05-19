import { NextRequest } from "next/server";
import { eventBus } from "@/lib/event-bus";
import { getBarState } from "@/lib/settings";

export const dynamic = "force-dynamic";

function encodeSSE(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
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

  const barState = await getBarState();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSSE("bar.state", barState));

      const unsubscribeSystem = eventBus.subscribeSystem((event) => {
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
        unsubscribeSystem();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, { headers });
}
