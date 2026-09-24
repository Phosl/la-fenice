import "server-only";

const MINIMUM_SIGNING_SECRET_LENGTH = 32;

export const CONCIERGE_SESSION_COOKIE = "lf_demo_concierge";
export const CONCIERGE_SESSION_TTL_SECONDS = 2 * 60 * 60;
export const CONCIERGE_SPEECH_TOKEN_TTL_SECONDS = 5 * 60;

export interface ConciergeServerConfig {
  enabled: boolean;
  apiKey?: string;
  chatModel: string;
  ttsModel: string;
  signingSecret?: string;
  configured: boolean;
}

export function getConciergeServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ConciergeServerConfig {
  const enabled = env.CONCIERGE_DEMO_ENABLED === "true";
  const apiKey = env.OPENAI_API_KEY?.trim() || undefined;
  const signingSecret = env.CONCIERGE_SIGNING_SECRET?.trim() || undefined;

  return {
    enabled,
    apiKey,
    chatModel: env.OPENAI_CONCIERGE_MODEL?.trim() || "gpt-5.6-terra",
    ttsModel: env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
    signingSecret,
    configured: Boolean(
      enabled &&
        apiKey &&
        signingSecret &&
        signingSecret.length >= MINIMUM_SIGNING_SECRET_LENGTH
    ),
  };
}
