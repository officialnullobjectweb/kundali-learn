// Tiny in-memory fixed-window rate limiter. Guards the free-tier database
// against runaway loops (a stuck AI client retrying, a shared link going
// viral). Per serverless instance; each instance enforces its own share,
// which is enough to keep the DB breathing. Limits:
//   MCP per secret: 60/min · MCP per IP: 180/min · REST per IP: 240/min.
interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

function sweep(now: number): void {
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now >= b.reset) buckets.delete(k);
    }
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): {
  ok: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || now >= b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfterMs: Math.max(0, b.reset - now) };
  b.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim().slice(0, 64);
  return 'local';
}
