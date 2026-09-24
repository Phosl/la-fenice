import {
  conciergeApiErrorCodeSchema,
  conciergeChatResponseSchema,
  type ConciergeApiErrorCode,
  type ConciergeChatRequest,
  type ConciergeChatResponse,
  type ConciergeSessionRequest,
  type ConciergeSessionStatus,
  type ConciergeSpeechRequest,
} from "@/lib/concierge/contract";

export class ConciergeClientError extends Error {
  constructor(
    public readonly code: ConciergeApiErrorCode,
    public readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "ConciergeClientError";
  }
}

function parseSessionStatus(value: unknown): ConciergeSessionStatus | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ConciergeSessionStatus>;
  if (
    typeof candidate.authenticated !== "boolean" ||
    typeof candidate.configured !== "boolean"
  ) {
    return null;
  }
  return {
    authenticated: candidate.authenticated,
    configured: candidate.configured,
  };
}

async function parseApiError(response: Response): Promise<ConciergeClientError> {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    return new ConciergeClientError("provider_unavailable");
  }

  if (!value || typeof value !== "object") {
    return new ConciergeClientError("provider_unavailable");
  }
  const candidate = value as {
    code?: unknown;
    retryAfterSeconds?: unknown;
  };
  const code = conciergeApiErrorCodeSchema.safeParse(candidate.code);
  return new ConciergeClientError(
    code.success ? code.data : "provider_unavailable",
    typeof candidate.retryAfterSeconds === "number"
      ? candidate.retryAfterSeconds
      : undefined,
  );
}

async function jsonRequest(
  path: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(path, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new ConciergeClientError("provider_unavailable");
  }
}

export async function getConciergeSessionStatus(): Promise<ConciergeSessionStatus> {
  const response = await jsonRequest("/api/demo/concierge/session", {
    method: "GET",
  });
  if (!response.ok) throw await parseApiError(response);
  const status = parseSessionStatus(await response.json());
  if (!status) throw new ConciergeClientError("provider_unavailable");
  return status;
}

export async function establishConciergeSession(
  input: ConciergeSessionRequest,
): Promise<ConciergeSessionStatus> {
  const response = await jsonRequest("/api/demo/concierge/session", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseApiError(response);
  const status = parseSessionStatus(await response.json());
  if (!status) throw new ConciergeClientError("provider_unavailable");
  return status;
}

export async function endConciergeSession(): Promise<void> {
  try {
    const response = await jsonRequest("/api/demo/concierge/session", {
      method: "DELETE",
    });
    if (!response.ok) throw await parseApiError(response);
  } catch {
    // Logging out of the browser-only demo must never be blocked by API state.
  }
}

export async function sendConciergeMessage(
  input: ConciergeChatRequest,
  signal?: AbortSignal,
): Promise<ConciergeChatResponse> {
  const response = await jsonRequest("/api/demo/concierge/chat", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw await parseApiError(response);
  const parsed = conciergeChatResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new ConciergeClientError("provider_unavailable");
  return parsed.data;
}

export async function requestConciergeSpeech(
  input: ConciergeSpeechRequest,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await jsonRequest("/api/demo/concierge/speech", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw await parseApiError(response);
  if (!response.headers.get("content-type")?.startsWith("audio/")) {
    throw new ConciergeClientError("provider_unavailable");
  }
  return response.blob();
}
