interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TOKENS = 10;
const REFILL_INTERVAL_MS = 60_000;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(ip, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= REFILL_INTERVAL_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const retryAfterMs = REFILL_INTERVAL_MS - elapsed;
    return { allowed: false, retryAfterMs };
  }

  bucket.tokens -= 1;
  return { allowed: true };
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const cutoff = Date.now() - REFILL_INTERVAL_MS * 2;
      for (const [ip, bucket] of buckets.entries()) {
        if (bucket.lastRefill < cutoff) buckets.delete(ip);
      }
    },
    5 * 60_000
  );
}
