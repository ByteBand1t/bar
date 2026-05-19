import { NextResponse } from "next/server";
import {
  getBarState,
  setSetting,
  SETTING_ACCEPTING_ORDERS,
  SETTING_PAUSE_MESSAGE,
  SETTING_PAUSE_UNTIL,
} from "@/lib/settings";
import { eventBus } from "@/lib/event-bus";
import { log } from "@/lib/logger";

export async function POST() {
  await setSetting(SETTING_ACCEPTING_ORDERS, true);
  await setSetting(SETTING_PAUSE_MESSAGE, null);
  await setSetting(SETTING_PAUSE_UNTIL, null);

  const state = await getBarState();
  eventBus.publishSystem({ type: "bar.state_changed", payload: state });
  log.info("bar_resumed", { route: "/api/bar/resume", status: 200 });

  return NextResponse.json(state);
}
