interface LoginAttempt {
  failures: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const MAX_FAILURES = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 min
const CLEANUP_AFTER_MS = 30 * 60 * 1000;

const attempts = new Map<string, LoginAttempt>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry) {
    return { allowed: true };
  }

  if (entry.lockedUntil !== null) {
    if (now < entry.lockedUntil) {
      return { allowed: false, retryAfterMs: entry.lockedUntil - now };
    }
    // Lockout expired – reset
    attempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip) ?? { failures: 0, lockedUntil: null, lastAttempt: now };
  entry.failures += 1;
  entry.lastAttempt = now;

  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }

  attempts.set(ip, entry);
}

export function recordLoginSuccess(ip: string): void {
  attempts.delete(ip);
}

// Cleanup stale entries every 15 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - CLEANUP_AFTER_MS;
    for (const [ip, entry] of attempts.entries()) {
      if (entry.lastAttempt < cutoff) attempts.delete(ip);
    }
  }, 15 * 60_000);
}
