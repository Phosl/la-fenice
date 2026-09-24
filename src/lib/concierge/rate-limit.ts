import "server-only";

interface RateWindow {
  maximum: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 5_000;

function pruneBucket(key: string, oldestRelevantTime: number): number[] {
  const retained = (buckets.get(key) ?? []).filter(
    (timestamp) => timestamp > oldestRelevantTime,
  );
  if (retained.length) buckets.set(key, retained);
  else buckets.delete(key);
  return retained;
}

function trimBucketCount(): void {
  if (buckets.size <= MAX_BUCKETS) return;
  const overflow = buckets.size - MAX_BUCKETS;
  let removed = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    removed += 1;
    if (removed >= overflow) return;
  }
}

function consumeWindows(
  namespace: string,
  identity: string,
  windows: readonly RateWindow[],
  now = Date.now(),
): RateLimitResult {
  const key = `${namespace}:${identity}`;
  const longestWindow = Math.max(...windows.map((window) => window.windowMs));
  const timestamps = pruneBucket(key, now - longestWindow);
  let retryAfterMs = 0;

  for (const window of windows) {
    const withinWindow = timestamps.filter(
      (timestamp) => timestamp > now - window.windowMs,
    );
    if (withinWindow.length >= window.maximum) {
      retryAfterMs = Math.max(
        retryAfterMs,
        withinWindow[0] + window.windowMs - now,
      );
    }
  }

  if (retryAfterMs > 0) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1_000)),
    };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  trimBucketCount();
  return { allowed: true };
}

function combineLimits(...results: RateLimitResult[]): RateLimitResult {
  const rejected = results.filter((result) => !result.allowed);
  if (!rejected.length) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      ...rejected.map((result) => result.retryAfterSeconds ?? 1),
    ),
  };
}

export function consumeChatRateLimit(
  sessionId: string,
  clientAddress: string,
  now = Date.now(),
): RateLimitResult {
  return combineLimits(
    consumeWindows(
      "chat-session",
      sessionId,
      [
        { maximum: 6, windowMs: 60_000 },
        { maximum: 30, windowMs: 60 * 60_000 },
      ],
      now,
    ),
    consumeWindows(
      "chat-address",
      clientAddress,
      [
        { maximum: 12, windowMs: 60_000 },
        { maximum: 90, windowMs: 60 * 60_000 },
      ],
      now,
    ),
  );
}

export function consumeSessionRateLimit(
  clientAddress: string,
  now = Date.now(),
): RateLimitResult {
  return consumeWindows(
    "session-address",
    clientAddress,
    [
      { maximum: 10, windowMs: 60_000 },
      { maximum: 50, windowMs: 60 * 60_000 },
    ],
    now,
  );
}

export function consumeSpeechRateLimit(
  sessionId: string,
  clientAddress: string,
  now = Date.now(),
): RateLimitResult {
  return combineLimits(
    consumeWindows(
      "speech-session",
      sessionId,
      [
        { maximum: 10, windowMs: 60_000 },
        { maximum: 40, windowMs: 60 * 60_000 },
      ],
      now,
    ),
    consumeWindows(
      "speech-address",
      clientAddress,
      [
        { maximum: 20, windowMs: 60_000 },
        { maximum: 120, windowMs: 60 * 60_000 },
      ],
      now,
    ),
  );
}

export function resetConciergeRateLimits(): void {
  buckets.clear();
}
