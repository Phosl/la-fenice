import type { NextRequest } from "next/server";

import {
  createSafetyIdentifier,
  createSpeechToken,
} from "@/lib/concierge/auth";
import { conciergeChatRequestSchema } from "@/lib/concierge/contract";
import { guardAuthenticatedConciergePost } from "@/lib/concierge/guard";
import {
  conciergeError,
  conciergeJson,
  createConciergeRequestId,
  getClientAddress,
  safeConciergeLog,
} from "@/lib/concierge/http";
import { consumeChatRateLimit } from "@/lib/concierge/rate-limit";
import {
  createConciergeChat,
} from "@/lib/concierge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_CHAT_BODY_BYTES = 128 * 1_024;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = createConciergeRequestId();
  const guard = guardAuthenticatedConciergePost(
    request,
    requestId,
    MAX_CHAT_BODY_BYTES,
  );
  if (!guard.ok) return guard.response;
  const { config, session } = guard;

  const rateLimit = consumeChatRateLimit(
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
  const parsed = conciergeChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return conciergeError("invalid_request", requestId, 400);
  }

  try {
    const result = await createConciergeChat(parsed.data, {
      config,
      safetyIdentifier: createSafetyIdentifier(
        session.sessionId,
        config.signingSecret,
      ),
      signal: request.signal,
    });
    const messageId = createConciergeRequestId();
    const speechToken = createSpeechToken(
      {
        sessionId: session.sessionId,
        messageId,
        locale: parsed.data.locale,
        text: result.output.answer,
      },
      config.signingSecret,
    );

    safeConciergeLog(result.safetyFallback ? "warn" : "info", {
      operation: "chat",
      outcome: result.safetyFallback ? "safety_fallback" : "completed",
      requestId,
      model: config.chatModel,
      durationMs: Date.now() - startedAt,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    });
    return conciergeJson(
      {
        ...result.output,
        requestId,
        messageId,
        speechToken,
      },
      { requestId },
    );
  } catch {
    safeConciergeLog("error", {
      operation: "chat",
      outcome: "failed",
      requestId,
      code: "PROVIDER_UNAVAILABLE",
      model: config.chatModel,
      durationMs: Date.now() - startedAt,
    });
    return conciergeError("provider_unavailable", requestId, 503);
  }
}
