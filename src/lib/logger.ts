type Level = "info" | "warn" | "error";

interface LogFields {
  route?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(level: Level, msg: string, fields: LogFields = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => emit("error", msg, fields),
};

/** Wraps an API handler with timing + structured request logging. */
export function withLogging<A extends unknown[]>(
  route: string,
  handler: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const start = Date.now();
    try {
      const res = await handler(...args);
      log.info("request", {
        route,
        status: res.status,
        durationMs: Date.now() - start,
      });
      return res;
    } catch (err) {
      log.error("request_failed", {
        route,
        status: 500,
        durationMs: Date.now() - start,
        err: String(err),
      });
      throw err;
    }
  };
}
