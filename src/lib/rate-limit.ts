/**
 * lib/rate-limit.ts — reusable rate limiting
 *
 * Provides a reusable rateLimiter factory. The actual rate limit values for
 * each endpoint are defined in Security & Access Document §5:
 *   - Login/Signup: 10 req/15 min per IP
 *   - Checkout: 5 req/min per user
 *   - Support ticket creation: 10 req/hour per user
 *
 * TICKET-901 wires this into middleware. This file is the backing
 * implementation; do not apply limits directly from here — always go
 * through the middleware or a server action helper.
 *
 * Implementation note: uses a lightweight in-memory sliding window. This is
 * suitable for MVP/local deployments; a shared Redis-backed implementation can
 * replace the storage internals later without changing call sites.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * checkRateLimit — checks whether a given identifier (user ID or IP)
 * is within the configured rate limit window.
 *
 * Returns { success: true } if the request should proceed.
 * Returns { success: false } if the limit has been exceeded.
 *
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const globalMock = global as unknown as {
    __mockRateLimit?: RateLimitResult;
    __rateLimitStore?: Map<string, number[]>;
  };
  if (process.env.NODE_ENV === "test" && globalMock.__mockRateLimit !== undefined) {
    return globalMock.__mockRateLimit;
  }

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `${identifier}:${config.limit}:${config.windowSeconds}`;
  const store = globalMock.__rateLimitStore ?? new Map<string, number[]>();
  globalMock.__rateLimitStore = store;

  const recentHits = (store.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );
  const success = recentHits.length < config.limit;

  if (success) {
    recentHits.push(now);
  }

  if (recentHits.length > 0) {
    store.set(key, recentHits);
  } else {
    store.delete(key);
  }

  const oldestHit = recentHits[0] ?? now;

  return {
    success,
    remaining: Math.max(config.limit - recentHits.length, 0),
    resetAt: new Date(oldestHit + windowMs),
  };
}
