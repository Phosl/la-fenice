import "server-only";

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type {
  ConciergeApiErrorCode,
  ConciergeApiErrorResponse,
} from "./contract";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function createConciergeRequestId(): string {
  return randomUUID();
}

export function conciergeJson<T>(
  body: T,
  init: { status?: number; requestId?: string; headers?: HeadersInit } = {},
): NextResponse<T> {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    headers.set(key, value);
  }
  if (init.requestId) headers.set("X-Request-Id", init.requestId);
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}

export function conciergeError(
  code: ConciergeApiErrorCode,
  requestId: string,
  status: number,
  retryAfterSeconds?: number,
): NextResponse<ConciergeApiErrorResponse> {
  return conciergeJson(
    {
      ok: false,
      code,
      requestId,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    },
    {
      status,
      requestId,
      ...(retryAfterSeconds
        ? { headers: { "Retry-After": String(retryAfterSeconds) } }
        : {}),
    },
  );
}

function firstForwardedValue(value: string | null): string | undefined {
  return value?.split(",", 1)[0]?.trim() || undefined;
}

function expectedRequestOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>([request.nextUrl.origin]);
  const host =
    firstForwardedValue(request.headers.get("x-forwarded-host")) ??
    firstForwardedValue(request.headers.get("host"));
  const protocol =
    firstForwardedValue(request.headers.get("x-forwarded-proto")) ??
    request.nextUrl.protocol.replace(":", "");

  if (host && protocol) {
    try {
      origins.add(new URL(`${protocol}://${host}`).origin);
    } catch {
      // The request URL remains the closed fallback.
    }
  }

  const canonicalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (canonicalSiteUrl) {
    try {
      origins.add(new URL(canonicalSiteUrl).origin);
    } catch {
      // Ignore a malformed optional canonical URL.
    }
  }
  return origins;
}

export function hasSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return expectedRequestOrigins(request).has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function hasJsonContentType(request: NextRequest): boolean {
  return /^application\/json(?:\s*;|$)/i.test(
    request.headers.get("content-type") ?? "",
  );
}

export function getClientAddress(request: NextRequest): string {
  return (
    firstForwardedValue(request.headers.get("x-forwarded-for")) ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

export function safeConciergeLog(
  level: "info" | "warn" | "error",
  metadata: {
    operation: "session" | "chat" | "speech";
    outcome: string;
    requestId: string;
    code?: string;
    durationMs?: number;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
  },
): void {
  console[level]({ scope: "concierge", ...metadata });
}

export const conciergeNoStoreHeaders = NO_STORE_HEADERS;
