import { db } from "@/lib/db";

export const SETTING_ACCEPTING_ORDERS = "accepting_orders";
export const SETTING_PAUSE_MESSAGE = "pause_message";
export const SETTING_PAUSE_UNTIL = "pause_until";

export interface BarState {
  acceptingOrders: boolean;
  pauseMessage: string | null;
  pauseUntil: string | null;
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const row = await db.barSetting.findUnique({ where: { key } });
  if (!row) return defaultValue;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  await db.barSetting.upsert({
    where: { key },
    create: { key, value: serialized },
    update: { value: serialized },
  });
}

/**
 * Reads the three pause-related settings in one query. If pause_until is set
 * and lies in the past, the pause is treated as expired and accepting_orders
 * is auto-reset to true (persisted, so the state stays consistent).
 */
export async function getBarState(): Promise<BarState> {
  const rows = await db.barSetting.findMany({
    where: {
      key: {
        in: [SETTING_ACCEPTING_ORDERS, SETTING_PAUSE_MESSAGE, SETTING_PAUSE_UNTIL],
      },
    },
  });

  const map = new Map(rows.map((r) => [r.key, r.value]));

  const parse = <T>(key: string, fallback: T): T => {
    const raw = map.get(key);
    if (raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  let acceptingOrders = parse<boolean>(SETTING_ACCEPTING_ORDERS, true);
  const pauseMessage = parse<string | null>(SETTING_PAUSE_MESSAGE, null);
  const pauseUntil = parse<string | null>(SETTING_PAUSE_UNTIL, null);

  if (!acceptingOrders && pauseUntil) {
    const until = new Date(pauseUntil).getTime();
    if (!Number.isNaN(until) && until <= Date.now()) {
      acceptingOrders = true;
      await setSetting(SETTING_ACCEPTING_ORDERS, true);
      await setSetting(SETTING_PAUSE_UNTIL, null);
      return { acceptingOrders: true, pauseMessage, pauseUntil: null };
    }
  }

  return { acceptingOrders, pauseMessage, pauseUntil };
}
