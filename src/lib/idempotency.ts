interface Entry {
  orderId: string;
  at: number;
}

const globalForIdem = globalThis as unknown as {
  idemStore?: Map<string, Entry>;
};

const store = globalForIdem.idemStore ?? new Map<string, Entry>();
globalForIdem.idemStore = store;

const TTL_MS = 10 * 60_000;

export function getIdempotentOrder(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.orderId;
}

export function rememberIdempotentOrder(key: string, orderId: string): void {
  store.set(key, { orderId, at: Date.now() });
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - TTL_MS;
    for (const [k, v] of store.entries()) {
      if (v.at < cutoff) store.delete(k);
    }
  }, 5 * 60_000).unref?.();
}
