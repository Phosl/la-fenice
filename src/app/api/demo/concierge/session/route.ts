import type { NextRequest } from "next/server";

import {
  createConciergeSessionToken,
  verifyConciergeSessionToken,
  verifyDemoGuestCredentials,
} from "@/lib/concierge/auth";
import {
  CONCIERGE_SESSION_COOKIE,
  CONCIERGE_SESSION_TTL_SECONDS,
  getConciergeServerConfig,
} from "@/lib/concierge/config";
import {
  conciergeSessionRequestSchema,
  type ConciergeSessionStatus,
} from "@/lib/concierge/contract";
import {
  conciergeError,
  conciergeJson,
  createConciergeRequestId,
  getClientAddress,
  hasJsonContentType,
  hasSameOrigin,
} from "@/lib/concierge/http";
import { consumeSessionRateLimit } from "@/lib/concierge/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionStatus(
  request: NextRequest,
): { status: ConciergeSessionStatus; configured: boolean } {
  const config = getConciergeServerConfig();
  const session =
    config.configured && config.signingSecret
      ? verifyConciergeSessionToken(
          request.cookies.get(CONCIERGE_SESSION_COOKIE)?.value,
          config.signingSecret,
        )
      : null;
  return {
    status: {
      authenticated: Boolean(session),
      configured: config.configured,
    },
    configured: config.configured,
  };
}

export async function GET(request: NextRequest) {
  return conciergeJson(sessionStatus(request).status);
}

export async function POST(request: NextRequest) {
  const requestId = createConciergeRequestId();
  if (!hasSameOrigin(request)) {
    return conciergeError("invalid_origin", requestId, 403);
  }
  if (!hasJsonContentType(request)) {
    return conciergeError("invalid_request", requestId, 400);
  }

  const rateLimit = consumeSessionRateLimit(getClientAddress(request));
  if (!rateLimit.allowed) {
    return conciergeError(
      "rate_limited",
      requestId,
      429,
      rateLimit.retryAfterSeconds,
    );
  }

  const config = getConciergeServerConfig();
  if (!config.configured || !config.signingSecret) {
    return conciergeError("not_configured", requestId, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return conciergeError("invalid_request", requestId, 400);
  }
  const parsed = conciergeSessionRequestSchema.safeParse(body);
  if (
    !parsed.success ||
    !verifyDemoGuestCredentials(parsed.data.loginCode, parsed.data.password)
  ) {
    return conciergeError("not_authenticated", requestId, 401);
  }

  const { token } = createConciergeSessionToken(config.signingSecret);
  const response = conciergeJson<ConciergeSessionStatus>(
    { authenticated: true, configured: true },
    { requestId },
  );
  response.cookies.set({
    name: CONCIERGE_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/demo/concierge",
    maxAge: CONCIERGE_SESSION_TTL_SECONDS,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const requestId = createConciergeRequestId();
  if (!hasSameOrigin(request)) {
    return conciergeError("invalid_origin", requestId, 403);
  }

  const configured = sessionStatus(request).configured;
  const response = conciergeJson<ConciergeSessionStatus>(
    { authenticated: false, configured },
    { requestId },
  );
  response.cookies.set({
    name: CONCIERGE_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/demo/concierge",
    maxAge: 0,
  });
  return response;
}
