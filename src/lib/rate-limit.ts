import AppConfig from "@/app/config";

/**
 * Sliding-window rate limiter kept in process memory.
 *
 * On Vercel each serverless instance has its own memory, so under a burst
 * the effective limit is per instance rather than global. That is enough to
 * stop a runaway client or a shared URL from draining the API key; for a hard
 * global limit, swap this for a Redis-backed limiter.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const PRUNE_EVERY = 200;

const timestampsByKey = new Map<string, number[]>();
let callsSincePrune = 0;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export const getClientKey = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
};

const pruneStale = (now: number): void => {
  timestampsByKey.forEach((stamps, key) => {
    const fresh = stamps.filter((t) => now - t < HOUR_MS);
    if (fresh.length === 0) {
      timestampsByKey.delete(key);
    } else {
      timestampsByKey.set(key, fresh);
    }
  });
};

export const checkRateLimit = (
  key: string,
  now: number = Date.now()
): RateLimitResult => {
  callsSincePrune += 1;
  if (callsSincePrune >= PRUNE_EVERY) {
    callsSincePrune = 0;
    pruneStale(now);
  }

  const stamps = (timestampsByKey.get(key) ?? []).filter(
    (t) => now - t < HOUR_MS
  );
  const lastMinute = stamps.filter((t) => now - t < MINUTE_MS);

  if (lastMinute.length >= AppConfig.rateLimit.perMinute) {
    const oldest = Math.min(...lastMinute);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + MINUTE_MS - now) / 1000)),
    };
  }

  if (stamps.length >= AppConfig.rateLimit.perHour) {
    const oldest = Math.min(...stamps);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + HOUR_MS - now) / 1000)),
    };
  }

  stamps.push(now);
  timestampsByKey.set(key, stamps);
  return { ok: true };
};
