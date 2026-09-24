import "server-only";

import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { DEMO_GUEST_CREDENTIALS } from "@/lib/demo-portal/seed";

import type {
  ConciergeLocale,
  ConciergeSpeechRequest,
} from "./contract";
import {
  CONCIERGE_SESSION_TTL_SECONDS,
  CONCIERGE_SPEECH_TOKEN_TTL_SECONDS,
} from "./config";

interface SignedTokenEnvelope {
  payload: string;
  signature: string;
}

export interface ConciergeSessionClaims {
  kind: "concierge-session";
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}

interface ConciergeSpeechClaims {
  kind: "concierge-speech";
  sessionId: string;
  messageId: string;
  locale: ConciergeLocale;
  textHash: string;
  expiresAt: number;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function encodeSignedToken(value: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

function splitSignedToken(token: string): SignedTokenEnvelope | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;
  return {
    payload: token.slice(0, separator),
    signature: token.slice(separator + 1),
  };
}

function decodeSignedToken(token: string, secret: string): unknown {
  const envelope = splitSignedToken(token);
  if (!envelope) return null;
  const expectedSignature = signPayload(envelope.payload, secret);
  if (!safeEqual(envelope.signature, expectedSignature)) return null;

  try {
    return JSON.parse(Buffer.from(envelope.payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

export function verifyDemoGuestCredentials(
  loginCode: string,
  password: string,
): boolean {
  return (
    safeEqual(
      loginCode.trim().toLocaleLowerCase("it-IT"),
      DEMO_GUEST_CREDENTIALS.loginCode,
    ) && safeEqual(password, DEMO_GUEST_CREDENTIALS.password)
  );
}

export function createConciergeSessionToken(
  secret: string,
  now = Date.now(),
): { token: string; claims: ConciergeSessionClaims } {
  const issuedAt = Math.floor(now / 1_000);
  const claims: ConciergeSessionClaims = {
    kind: "concierge-session",
    sessionId: randomUUID(),
    issuedAt,
    expiresAt: issuedAt + CONCIERGE_SESSION_TTL_SECONDS,
  };
  return { token: encodeSignedToken(claims, secret), claims };
}

export function verifyConciergeSessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): ConciergeSessionClaims | null {
  if (!token) return null;
  const value = decodeSignedToken(token, secret);
  if (typeof value !== "object" || value === null) return null;

  const claims = value as Partial<ConciergeSessionClaims>;
  const nowSeconds = Math.floor(now / 1_000);
  if (
    claims.kind !== "concierge-session" ||
    typeof claims.sessionId !== "string" ||
    !claims.sessionId ||
    !isFiniteInteger(claims.issuedAt) ||
    !isFiniteInteger(claims.expiresAt) ||
    claims.issuedAt > nowSeconds + 60 ||
    claims.expiresAt <= nowSeconds ||
    claims.expiresAt - claims.issuedAt > CONCIERGE_SESSION_TTL_SECONDS
  ) {
    return null;
  }

  return claims as ConciergeSessionClaims;
}

export function createSpeechToken(
  input: {
    sessionId: string;
    messageId: string;
    locale: ConciergeLocale;
    text: string;
  },
  secret: string,
  now = Date.now(),
): string {
  const claims: ConciergeSpeechClaims = {
    kind: "concierge-speech",
    sessionId: input.sessionId,
    messageId: input.messageId,
    locale: input.locale,
    textHash: hashText(input.text),
    expiresAt: Math.floor(now / 1_000) + CONCIERGE_SPEECH_TOKEN_TTL_SECONDS,
  };
  return encodeSignedToken(claims, secret);
}

export function verifySpeechToken(
  request: ConciergeSpeechRequest,
  session: ConciergeSessionClaims,
  secret: string,
  now = Date.now(),
): boolean {
  const value = decodeSignedToken(request.speechToken, secret);
  if (typeof value !== "object" || value === null) return false;

  const claims = value as Partial<ConciergeSpeechClaims>;
  return Boolean(
    claims.kind === "concierge-speech" &&
      claims.sessionId === session.sessionId &&
      claims.messageId === request.messageId &&
      claims.locale === request.locale &&
      claims.textHash === hashText(request.text) &&
      isFiniteInteger(claims.expiresAt) &&
      claims.expiresAt > Math.floor(now / 1_000) &&
      claims.expiresAt - Math.floor(now / 1_000) <=
        CONCIERGE_SPEECH_TOKEN_TTL_SECONDS
  );
}

export function createSafetyIdentifier(
  sessionId: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`concierge:${sessionId}`)
    .digest("hex");
}
