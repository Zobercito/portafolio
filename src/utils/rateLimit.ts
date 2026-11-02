export interface RateLimitStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  /** Injectable clock (ms since epoch) so the limiter is testable. */
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-window counter over fixed sub-buckets. The window is covered by
 * BUCKETS_PER_WINDOW reads/writes keyed by bucket index, so state is shared
 * across Workers isolates (KV) and expired buckets disappear via store TTL
 * instead of requiring a cleanup pass. The boundary is approximate within
 * one bucket width, which is acceptable for abuse protection.
 */
const BUCKETS_PER_WINDOW = 6;

export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  { limit, windowMs, now = Date.now() }: RateLimitOptions,
): Promise<RateLimitResult> {
  const bucketMs = Math.max(1000, Math.ceil(windowMs / BUCKETS_PER_WINDOW));
  const bucketCount = Math.max(1, Math.ceil(windowMs / bucketMs));
  const currentBucket = Math.floor(now / bucketMs);

  const windowKeys: string[] = [];
  for (let i = 0; i < bucketCount; i += 1) {
    const bucket = currentBucket - i;
    if (bucket < 0) break;
    windowKeys.push(`rate-limit:${key}:${bucket}`);
  }

  const counts = await Promise.all(windowKeys.map((k) => store.get(k)));
  let total = 0;
  for (const stored of counts) {
    const parsed = Number.parseInt(stored ?? '0', 10);
    if (Number.isFinite(parsed) && parsed > 0) total += parsed;
  }

  if (total >= limit) {
    const rollOutAt = (currentBucket + 1) * bucketMs;
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((rollOutAt - now) / 1000)),
    };
  }

  const currentCount = counts[0];
  const parsedCurrent = Number.parseInt(currentCount ?? '0', 10);
  const safeCurrent = Number.isFinite(parsedCurrent) && parsedCurrent > 0 ? parsedCurrent : 0;
  await store.put(windowKeys[0], String(safeCurrent + 1), {
    expirationTtl: Math.ceil((windowMs + bucketMs) / 1000),
  });

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - total - 1),
    retryAfterSeconds: 0,
  };
}

export function createMemoryRateLimitStore(clock: () => number = Date.now): RateLimitStore {
  const entries = new Map<string, { value: string; expiresAt: number }>();

  return {
    async get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= clock()) {
        entries.delete(key);
        return null;
      }
      return entry.value;
    },
    async put(key, value, options) {
      const ttlMs = (options?.expirationTtl ?? 60) * 1000;
      entries.set(key, { value, expiresAt: clock() + ttlMs });
    },
  };
}

export interface KvRateLimitBinding {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

export function createKvRateLimitStore(kv: KvRateLimitBinding): RateLimitStore {
  return {
    get: (key) => kv.get(key),
    put: (key, value, options) => kv.put(key, value, options),
  };
}
