// src/lib/rate-limit.ts
// Simple in-memory fixed-window rate limiter for the endpoints the SRD calls
// out (login, password reset, reviews, refund requests, tournament registration).
//
// NOTE: This is a per-instance limiter (resets on cold start / per container).
// For a multi-instance production deploy, back this with Upstash/Redis. It is
// sufficient as a first-line defense and satisfies the SRD's "rate limiting
// enabled" checklist item without adding a runtime dependency.
import { NextResponse } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Periodically prune expired buckets so the map can't grow unbounded.
const PRUNE_INTERVAL = 5 * 60 * 1000; // 5 min
let lastPrune = Date.now();

function prune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Identifier scope, e.g. an IP or user id. */
  key: string;
  /** Logical action name, e.g. "login", "review". */
  action: string;
  /** Max events allowed within the window. */
  limit: number;
  /** Window size in ms. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  prune();
  const compositeKey = `${opts.action}:${opts.key}`;
  const now = Date.now();
  const existing = store.get(compositeKey);

  if (!existing || existing.resetAt <= now) {
    store.set(compositeKey, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  return { ok: true, remaining: opts.limit - existing.count, retryAfterMs: 0 };
}

/** Extract a best-effort client identifier (IP) from a request. */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

/** Apply a rate limit to a request and return a 429 NextResponse when exceeded. */
export function enforceRateLimit(request: Request, opts: RateLimitOptions): NextResponse | null {
  const result = rateLimit(opts);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
        },
      }
    );
  }
  return null;
}
