import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import {
  verifyConciergeSessionToken,
  type ConciergeSessionClaims,
} from "./auth";
import {
  CONCIERGE_SESSION_COOKIE,
  getConciergeServerConfig,
  type ConciergeServerConfig,
} from "./config";
import type { ConciergeApiErrorResponse } from "./contract";
import {
  conciergeError,
  hasJsonContentType,
  hasSameOrigin,
} from "./http";

interface ConfiguredConciergeServerConfig extends ConciergeServerConfig {
  apiKey: string;
  signingSecret: string;
  configured: true;
}

type ConciergePostGuardResult =
  | {
      ok: true;
      config: ConfiguredConciergeServerConfig;
      session: ConciergeSessionClaims;
    }
  | { ok: false; response: NextResponse<ConciergeApiErrorResponse> };

export function guardAuthenticatedConciergePost(
  request: NextRequest,
  requestId: string,
  maximumBodyBytes: number,
): ConciergePostGuardResult {
  if (!hasSameOrigin(request)) {
    return { ok: false, response: conciergeError("invalid_origin", requestId, 403) };
  }
  if (!hasJsonContentType(request)) {
    return { ok: false, response: conciergeError("invalid_request", requestId, 400) };
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maximumBodyBytes) {
    return { ok: false, response: conciergeError("invalid_request", requestId, 413) };
  }

  const config = getConciergeServerConfig();
  if (!config.configured || !config.apiKey || !config.signingSecret) {
    return { ok: false, response: conciergeError("not_configured", requestId, 503) };
  }

  const session = verifyConciergeSessionToken(
    request.cookies.get(CONCIERGE_SESSION_COOKIE)?.value,
    config.signingSecret,
  );
  if (!session) {
    return { ok: false, response: conciergeError("not_authenticated", requestId, 401) };
  }

  return {
    ok: true,
    config: config as ConfiguredConciergeServerConfig,
    session,
  };
}
