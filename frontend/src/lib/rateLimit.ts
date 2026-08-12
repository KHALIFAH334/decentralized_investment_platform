/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Uses a Map keyed by IP address. Each entry stores an array of
 * timestamps representing recent requests. Old timestamps are
 * pruned on every check.
 *
 * NOTE: This is per-process. In a multi-instance deployment
 * (e.g. serverless), consider Redis-based rate limiting instead.
 */

interface RateLimitConfig {
  /** Max number of requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

/** Preset rate limit configurations */
export const RATE_LIMITS = {
  /** Write operations: 5 requests per 60 seconds */
  WRITE: { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  /** Read operations: 30 requests per 60 seconds */
  READ: { maxRequests: 30, windowMs: 60_000 } as RateLimitConfig,
  /** Upload operations: 3 requests per 60 seconds */
  UPLOAD: { maxRequests: 3, windowMs: 60_000 } as RateLimitConfig,
};

// Global store: IP -> list of request timestamps
const requestLog = new Map<string, number[]>();

// Periodically clean up stale entries to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60_000; // 5 minutes
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - 120_000; // Remove entries older than 2 minutes
  for (const [key, timestamps] of requestLog.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, valid);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check whether a request from the given identifier (usually IP)
 * is within the rate limit.
 *
 * @param identifier - Unique key (IP address, wallet address, etc.)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed, remaining quota, and reset time
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing timestamps and prune old ones
  const timestamps = (requestLog.get(identifier) || []).filter(
    (t) => t > windowStart
  );

  if (timestamps.length >= config.maxRequests) {
    // Rate limited — calculate when the oldest request in the window expires
    const oldestInWindow = timestamps[0];
    const resetMs = oldestInWindow + config.windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  // Allow the request — record the timestamp
  timestamps.push(now);
  requestLog.set(identifier, timestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    resetMs: config.windowMs,
  };
}

/**
 * Extract the client IP from a Next.js request.
 * Checks x-forwarded-for first (for proxies/load balancers),
 * then falls back to a default.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; take the first (client)
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Helper: returns a 429 Response if rate limited, or null if allowed.
 * Use at the top of API route handlers.
 */
export function rateLimitResponse(
  request: Request,
  config: RateLimitConfig
): Response | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retryAfterMs: result.resetMs,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(result.resetMs / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null; // Request is allowed
}
