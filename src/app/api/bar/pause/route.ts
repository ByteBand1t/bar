import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getBarState,
  setSetting,
  SETTING_ACCEPTING_ORDERS,
  SETTING_PAUSE_MESSAGE,
  SETTING_PAUSE_UNTIL,
} from "@/lib/settings";
import { eventBus } from "@/lib/event-bus";
import { log } from "@/lib/logger";

const PauseSchema = z.object({
  message: z.string().max(200).optional(),
  until: z.string().datetime().nullable().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = PauseSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", message: "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { message, until } = parsed.data;

  await setSetting(SETTING_ACCEPTING_ORDERS, false);
  await setSetting(SETTING_PAUSE_MESSAGE, message?.trim() || null);
  await setSetting(SETTING_PAUSE_UNTIL, until ?? null);

  const state = await getBarState();
  eventBus.publishSystem({ type: "bar.state_changed", payload: state });
  log.info("bar_paused", { route: "/api/bar/pause", status: 200 });

  return NextResponse.json(state);
}
