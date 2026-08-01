import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CANONICAL_SITE_URL } from "@/lib/site-url";

const canonicalHostname = new URL(CANONICAL_SITE_URL).hostname;
const apexHostname = canonicalHostname.replace(/^www\./, "");
const localHostnames = new Set(["127.0.0.1", "::1", "localhost"]);

export function shouldPreventIndexing(hostname: string): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  return (
    !localHostnames.has(normalizedHostname) &&
    normalizedHostname !== canonicalHostname &&
    normalizedHostname !== apexHostname
  );
}

function getPublicHostname(request: NextRequest): string {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",", 1)[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host");

  if (!host) return request.nextUrl.hostname;

  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return request.nextUrl.hostname;
  }
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (shouldPreventIndexing(getPublicHostname(request))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images/|logo-la-fenice|site.webmanifest|favicon.ico).*)",
  ],
};
