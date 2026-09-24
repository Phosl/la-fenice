import type {
  ConciergeLocale,
  ConciergeVoice,
} from "@/lib/concierge/contract";
import { DEMO_LOCALES } from "@/lib/demo-portal/types";

const STORAGE_PREFIX = "la-fenice:concierge:v1";
export const CONCIERGE_STORED_MESSAGE_LIMIT = 12;

export interface ConciergeStoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  locale: ConciergeLocale;
  recommendationIds: string[];
  suggestedPrompts: string[];
  speechToken?: string;
  createdAt: string;
}

export interface ConciergeConversation {
  version: 1;
  stayId: string;
  locale: ConciergeLocale;
  voice: ConciergeVoice;
  messages: ConciergeStoredMessage[];
  updatedAt: string;
}

function keyForStay(stayId: string): string {
  return `${STORAGE_PREFIX}:${stayId}`;
}

function isStringArray(value: unknown, maximum: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximum &&
    value.every((item) => typeof item === "string")
  );
}

function isMessage(value: unknown): value is ConciergeStoredMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ConciergeStoredMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.length > 0 &&
    candidate.content.length <= 1_600 &&
    DEMO_LOCALES.includes(candidate.locale as ConciergeLocale) &&
    isStringArray(candidate.recommendationIds, 4) &&
    isStringArray(candidate.suggestedPrompts, 3) &&
    (candidate.speechToken === undefined ||
      (typeof candidate.speechToken === "string" &&
        candidate.speechToken.length <= 2_000)) &&
    typeof candidate.createdAt === "string"
  );
}

function isConversation(
  value: unknown,
  stayId: string,
): value is ConciergeConversation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ConciergeConversation>;
  return (
    candidate.version === 1 &&
    candidate.stayId === stayId &&
    DEMO_LOCALES.includes(candidate.locale as ConciergeLocale) &&
    (candidate.voice === "female" || candidate.voice === "male") &&
    Array.isArray(candidate.messages) &&
    candidate.messages.length <= CONCIERGE_STORED_MESSAGE_LIMIT &&
    candidate.messages.every(isMessage) &&
    typeof candidate.updatedAt === "string"
  );
}

export function createConciergeConversation(
  stayId: string,
  locale: ConciergeLocale,
): ConciergeConversation {
  return {
    version: 1,
    stayId,
    locale,
    voice: "female",
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadConciergeConversation(
  stayId: string,
  fallbackLocale: ConciergeLocale,
): ConciergeConversation {
  if (typeof window === "undefined") {
    return createConciergeConversation(stayId, fallbackLocale);
  }
  try {
    const raw = window.sessionStorage.getItem(keyForStay(stayId));
    if (!raw) return createConciergeConversation(stayId, fallbackLocale);
    const parsed: unknown = JSON.parse(raw);
    return isConversation(parsed, stayId)
      ? parsed
      : createConciergeConversation(stayId, fallbackLocale);
  } catch {
    return createConciergeConversation(stayId, fallbackLocale);
  }
}

export function saveConciergeConversation(
  conversation: ConciergeConversation,
): boolean {
  if (typeof window === "undefined") return false;
  const bounded: ConciergeConversation = {
    ...conversation,
    messages: conversation.messages.slice(-CONCIERGE_STORED_MESSAGE_LIMIT),
    updatedAt: new Date().toISOString(),
  };
  try {
    window.sessionStorage.setItem(
      keyForStay(conversation.stayId),
      JSON.stringify(bounded),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearConciergeConversation(
  stayId: string,
  locale: ConciergeLocale,
  voice: ConciergeVoice,
): ConciergeConversation {
  const next: ConciergeConversation = {
    ...createConciergeConversation(stayId, locale),
    voice,
  };
  saveConciergeConversation(next);
  return next;
}

export function clearAllConciergeStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(`${STORAGE_PREFIX}:`)) keys.push(key);
    }
    for (const key of keys) window.sessionStorage.removeItem(key);
  } catch {
    // Storage may be unavailable in privacy mode; logout must still complete.
  }
}
