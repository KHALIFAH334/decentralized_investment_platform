import { Redis } from '@upstash/redis';

/**
 * Rate limiter for Next.js API routes.
 *
 * Uses Upstash Redis (@upstash/redis) if configured via environment variables.
 * Falls back to an in-memory Map (per-process) for local development or if
 * Redis is not configured.
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

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// -------------------------------------------------------------------------
// Redis setup
// -------------------------------------------------------------------------
let redis: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Upstash Redis initialized for rate limiting.');
  } catch (err) {
    console.error('Failed to initialize Upstash Redis. Falling back to in-memory.', err);
  }
} else {
  console.log('UPSTASH_REDIS_REST_URL missing. Using in-memory rate limiting.');
}

// -------------------------------------------------------------------------
// In-Memory Fallback Implementation
// -------------------------------------------------------------------------
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

function checkRateLimitInMemory(
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

// -------------------------------------------------------------------------
// Redis Implementation
// -------------------------------------------------------------------------
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return checkRateLimitInMemory(identifier, config);
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `ratelimit:${identifier}`;

  try {
    // 1. Add current timestamp to a sorted set, score = timestamp
    // 2. Remove all elements with score < windowStart
    // 3. Count elements in the window
    // 4. Update the TTL of the key
    const pipeline = redis.pipeline();
    pipeline.zadd(key, { score: now, member: now.toString() });
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.pexpire(key, config.windowMs);

    const results = await pipeline.exec();
    const count = (results[2] as number) || 1;

    if (count > config.maxRequests) {
      // Need to find the oldest request in the current window to calculate reset
      const oldestElements = await redis.zrange(key, 0, 0);
      let oldestTimestamp = now;
      if (oldestElements.length > 0) {
        oldestTimestamp = parseInt(oldestElements[0] as string, 10);
      }
      
      const resetMs = oldestTimestamp + config.windowMs - now;
      
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(resetMs, 0),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetMs: config.windowMs,
    };
  } catch (error) {
    console.error('Redis rate limit error, allowing request:', error);
    // Fail open or fallback
    return { allowed: true, remaining: 1, resetMs: config.windowMs };
  }
}

/**
 * Check whether a request from the given identifier (usually IP)
 * is within the rate limit.
 *
 * @param identifier - Unique key (IP address, wallet address, etc.)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed, remaining quota, and reset time
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (redis) {
    return checkRateLimitRedis(identifier, config);
  }
  return checkRateLimitInMemory(identifier, config);
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
export async function rateLimitResponse(
  request: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(ip, config);

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
