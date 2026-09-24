// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createConciergeSessionToken,
  createSpeechToken,
  verifyConciergeSessionToken,
  verifyDemoGuestCredentials,
  verifySpeechToken,
} from "./auth";
import type { ConciergeSpeechRequest } from "./contract";
import { getConciergeServerConfig } from "./config";
import {
  consumeChatRateLimit,
  resetConciergeRateLimits,
} from "./rate-limit";

const secret = "a-demo-signing-secret-with-at-least-32-characters";
const now = Date.UTC(2026, 7, 2, 12, 0, 0);

describe("concierge server security", () => {
  beforeEach(() => resetConciergeRateLimits());

  it("keeps the paid demo disabled until explicitly opted in", () => {
    const credentials: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      OPENAI_API_KEY: "sk-demo",
      CONCIERGE_SIGNING_SECRET: secret,
    };

    expect(getConciergeServerConfig(credentials)).toMatchObject({
      enabled: false,
      configured: false,
    });
    expect(
      getConciergeServerConfig({
        ...credentials,
        CONCIERGE_DEMO_ENABLED: "TRUE",
      }),
    ).toMatchObject({ enabled: false, configured: false });
    expect(
      getConciergeServerConfig({
        ...credentials,
        CONCIERGE_DEMO_ENABLED: "true",
      }),
    ).toMatchObject({ enabled: true, configured: true });
  });

  it("accepts only the fixed public guest credentials", () => {
    expect(verifyDemoGuestCredentials(" cliente ", "cliente")).toBe(true);
    expect(verifyDemoGuestCredentials("admin", "admin")).toBe(false);
    expect(verifyDemoGuestCredentials("cliente", "wrong")).toBe(false);
  });

  it("rejects tampered and expired session cookies", () => {
    const { token, claims } = createConciergeSessionToken(secret, now);
    expect(verifyConciergeSessionToken(token, secret, now)?.sessionId).toBe(
      claims.sessionId,
    );
    expect(verifyConciergeSessionToken(`${token}x`, secret, now)).toBeNull();
    expect(
      verifyConciergeSessionToken(token, secret, now + 9 * 60 * 60 * 1_000),
    ).toBeNull();
  });

  it("binds a speech token to session, message, language and text", () => {
    const { claims } = createConciergeSessionToken(secret, now);
    const baseRequest: ConciergeSpeechRequest = {
      locale: "it",
      voice: "female",
      messageId: "message-1",
      text: "Buonasera da Positano.",
      speechToken: "",
    };
    const speechToken = createSpeechToken(
      {
        sessionId: claims.sessionId,
        messageId: baseRequest.messageId,
        locale: baseRequest.locale,
        text: baseRequest.text,
      },
      secret,
      now,
    );
    const request = { ...baseRequest, speechToken };

    expect(verifySpeechToken(request, claims, secret, now)).toBe(true);
    expect(
      verifySpeechToken({ ...request, text: "Testo diverso" }, claims, secret, now),
    ).toBe(false);
    expect(
      verifySpeechToken({ ...request, locale: "de" }, claims, secret, now),
    ).toBe(false);
    expect(verifySpeechToken(request, claims, secret, now + 11 * 60 * 1_000)).toBe(
      false,
    );
  });

  it("returns a retry interval after the chat burst limit", () => {
    for (let index = 0; index < 6; index += 1) {
      expect(consumeChatRateLimit("session", "127.0.0.1", now).allowed).toBe(
        true,
      );
    }
    const limited = consumeChatRateLimit("session", "127.0.0.1", now);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterSeconds).toBe(60);
  });
});
