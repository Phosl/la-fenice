import type { NextRequest } from "next/server";

import { verifySpeechToken } from "@/lib/concierge/auth";
import { conciergeSpeechRequestSchema } from "@/lib/concierge/contract";
import { guardAuthenticatedConciergePost } from "@/lib/concierge/guard";
import {
  conciergeError,
  conciergeNoStoreHeaders,
  createConciergeRequestId,
  getClientAddress,
  safeConciergeLog,
} from "@/lib/concierge/http";
import { consumeSpeechRateLimit } from "@/lib/concierge/rate-limit";
import { createConciergeSpeech } from "@/lib/concierge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_SPEECH_BODY_BYTES = 8 * 1_024;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = createConciergeRequestId();
  const guard = guardAuthenticatedConciergePost(
    request,
    requestId,
    MAX_SPEECH_BODY_BYTES,
  );
  if (!guard.ok) return guard.response;
  const { config, session } = guard;

  const rateLimit = consumeSpeechRateLimit(
    session.sessionId,
    getClientAddress(request),
  );
  if (!rateLimit.allowed) {
    return conciergeError(
      "rate_limited",
      requestId,
      429,
      rateLimit.retryAfterSeconds,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return conciergeError("invalid_request", requestId, 400);
  }
  const parsed = conciergeSpeechRequestSchema.safeParse(body);
  if (!parsed.success) {
    return conciergeError("invalid_request", requestId, 400);
  }
  if (!verifySpeechToken(parsed.data, session, config.signingSecret)) {
    return conciergeError("invalid_speech_token", requestId, 422);
  }

  try {
    const audio = await createConciergeSpeech(parsed.data, {
      config,
      signal: request.signal,
    });
    safeConciergeLog("info", {
      operation: "speech",
      outcome: "streaming",
      requestId,
      model: config.ttsModel,
      durationMs: Date.now() - startedAt,
    });
    return new Response(audio.body, {
      status: 200,
      headers: {
        ...conciergeNoStoreHeaders,
        "Content-Type": "audio/mpeg",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId,
      },
    });
  } catch {
    safeConciergeLog("error", {
      operation: "speech",
      outcome: "failed",
      requestId,
      code: "PROVIDER_UNAVAILABLE",
      model: config.ttsModel,
      durationMs: Date.now() - startedAt,
    });
    return conciergeError("provider_unavailable", requestId, 503);
  }
}
