import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const isConfigured =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

const redis = isConfigured
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

/** Per-user limits */
export const aiLimiter = redis
  ? new Ratelimit({
      redis,
      // 60 AI calls per minute (generous for Pro users)
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "rl:ai",
    })
  : null;

export const heavyLimiter = redis
  ? new Ratelimit({
      redis,
      // Document generation is heavier: 20 per 10 minutes
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      analytics: true,
      prefix: "rl:heavy",
    })
  : null;

/** Anonymous IP limit (prevent webhook abuse) */
export const ipLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "rl:ip",
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit. If not configured, allow.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "リクエスト数の上限に達しました。しばらく時間をおいて再試行してください。",
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
        "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
      },
    }
  );
}
