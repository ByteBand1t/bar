import type { TimeRange } from "@/lib/stats";

export type RangeKey = "today" | "hour" | "15min" | "all";

export function resolveRange(key: string | null | undefined): {
  key: RangeKey;
  range: TimeRange | undefined;
} {
  const now = new Date();
  switch (key) {
    case "hour":
      return { key: "hour", range: { since: new Date(now.getTime() - 60 * 60_000) } };
    case "15min":
      return { key: "15min", range: { since: new Date(now.getTime() - 15 * 60_000) } };
    case "all":
      return { key: "all", range: undefined };
    case "today":
    default: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { key: "today", range: { since: start } };
    }
  }
}
