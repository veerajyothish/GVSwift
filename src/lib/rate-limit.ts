/**
 * lib/rate-limit.ts — Upstash Redis-backed rate limiting
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
 * Implementation note: uses a simple sliding window via Upstash REST API.
 * No @upstash/ratelimit package added yet — TICKET-901 installs it and
 * implements the full rate limiting middleware.
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
 * NOTE: Full implementation in TICKET-901 using @upstash/ratelimit.
 * This stub passes through all requests so that dependent tickets can
 * be built without the rate limiting fully wired up.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // TODO: TICKET-901 — replace with @upstash/ratelimit sliding window check
  // using UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN from env.
  void identifier;
  void config;
  return {
    success: true,
    remaining: 999,
    resetAt: new Date(Date.now() + 60_000),
  };
}
