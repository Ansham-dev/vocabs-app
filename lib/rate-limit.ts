// In-memory sliding-window rate limiter.
//
// TRADEOFF (in-memory vs Redis): a Map is zero-infra and perfect for local dev
// and tests, but on Vercel each serverless instance has its OWN memory, so the
// limit is approximate under concurrency (a user could get ~limit x instances).
// For strict global limits use Upstash Redis (see README). The factory below is
// deliberately store-shaped so it can be swapped for Redis later.
//
// Pure/testable: inject `now` in tests to control time.

export interface RateLimitOptions {
  /** Max requests per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Clock override (tests). Defaults to Date.now. */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window (0 when denied). */
  remaining: number;
  /** ms until the oldest hit slides out (0 when allowed & fresh). */
  resetMs: number;
}

export function createRateLimiter(opts: RateLimitOptions) {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  function check(key: string): RateLimitResult {
    const t = now();
    const windowStart = t - opts.windowMs;
    const list = (hits.get(key) ?? []).filter((ts) => ts > windowStart);
    if (list.length >= opts.limit) {
      const oldest = Math.min(...list);
      return { allowed: false, remaining: 0, resetMs: oldest + opts.windowMs - t };
    }
    list.push(t);
    hits.set(key, list);
    return { allowed: true, remaining: opts.limit - list.length, resetMs: 0 };
  }

  function reset(): void {
    hits.clear();
  }

  /** Current count (useful for UIs/tests). */
  function count(key: string): number {
    const t = now();
    const windowStart = t - opts.windowMs;
    return (hits.get(key) ?? []).filter((ts) => ts > windowStart).length;
  }

  return { check, reset, count };
}

// 15 AI messages per key per day, per the spec.
export const chatLimiter = createRateLimiter({
  limit: 15,
  windowMs: 24 * 60 * 60 * 1000,
});
