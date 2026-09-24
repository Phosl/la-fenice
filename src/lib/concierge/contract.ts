import { z } from "zod";

import {
  DEMO_GUIDE_CATEGORIES,
  DEMO_LOCALES,
} from "@/lib/demo-portal/types";

export const CONCIERGE_MAX_HISTORY = 10;
export const CONCIERGE_MAX_GUIDE_ITEMS = 40;
export const CONCIERGE_MAX_MESSAGE_LENGTH = 600;
export const CONCIERGE_MAX_REPLY_LENGTH = 1_600;

export const conciergeLocaleSchema = z.enum(DEMO_LOCALES);
export const conciergeVoiceSchema = z.enum(["female", "male"]);
export const conciergeCategorySchema = z.enum(["all", ...DEMO_GUIDE_CATEGORIES]);

const safeIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

export const conciergeHistoryMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(CONCIERGE_MAX_REPLY_LENGTH),
  })
  .strict();

export const conciergeGuideItemSchema = z
  .object({
    id: safeIdentifierSchema,
    category: z.enum(DEMO_GUIDE_CATEGORIES),
    label: z.string().trim().min(1).max(160),
    description: z.string().trim().max(700).optional(),
    address: z.string().trim().max(240).optional(),
    bookingNote: z.string().trim().max(400).optional(),
    requestable: z.boolean(),
  })
  .strict();

export const conciergeChatRequestSchema = z
  .object({
    locale: conciergeLocaleSchema,
    message: z.string().trim().min(1).max(CONCIERGE_MAX_MESSAGE_LENGTH),
    category: conciergeCategorySchema.default("all"),
    history: z
      .array(conciergeHistoryMessageSchema)
      .max(CONCIERGE_MAX_HISTORY)
      .default([]),
    guide: z
      .array(conciergeGuideItemSchema)
      .min(1)
      .max(CONCIERGE_MAX_GUIDE_ITEMS),
  })
  .strict();

export const conciergeAssistantOutputSchema = z
  .object({
    answer: z.string().trim().min(1).max(CONCIERGE_MAX_REPLY_LENGTH),
    recommendationIds: z.array(safeIdentifierSchema).max(4),
    suggestedPrompts: z.array(z.string().trim().min(1).max(140)).max(3),
  })
  .strict();

export const conciergeChatResponseSchema = conciergeAssistantOutputSchema
  .extend({
    requestId: z.string().min(1),
    messageId: z.string().min(1),
    speechToken: z.string().min(1),
  })
  .strict();

export const conciergeSpeechRequestSchema = z
  .object({
    locale: conciergeLocaleSchema,
    voice: conciergeVoiceSchema,
    messageId: safeIdentifierSchema,
    text: z.string().trim().min(1).max(CONCIERGE_MAX_REPLY_LENGTH),
    speechToken: z.string().min(1).max(2_000),
  })
  .strict();

export const conciergeSessionRequestSchema = z
  .object({
    loginCode: z.string().trim().min(1).max(60),
    password: z.string().min(1).max(100),
  })
  .strict();

export const conciergeApiErrorCodeSchema = z.enum([
  "invalid_request",
  "invalid_origin",
  "not_authenticated",
  "not_configured",
  "rate_limited",
  "content_blocked",
  "provider_unavailable",
  "invalid_speech_token",
]);

export type ConciergeLocale = z.infer<typeof conciergeLocaleSchema>;
export type ConciergeVoice = z.infer<typeof conciergeVoiceSchema>;
export type ConciergeCategory = z.infer<typeof conciergeCategorySchema>;
export type ConciergeHistoryMessage = z.infer<
  typeof conciergeHistoryMessageSchema
>;
export type ConciergeGuideItem = z.infer<typeof conciergeGuideItemSchema>;
export type ConciergeChatRequest = z.infer<typeof conciergeChatRequestSchema>;
export type ConciergeAssistantOutput = z.infer<
  typeof conciergeAssistantOutputSchema
>;
export type ConciergeChatResponse = z.infer<typeof conciergeChatResponseSchema>;
export type ConciergeSpeechRequest = z.infer<
  typeof conciergeSpeechRequestSchema
>;
export type ConciergeSessionRequest = z.infer<
  typeof conciergeSessionRequestSchema
>;
export type ConciergeApiErrorCode = z.infer<
  typeof conciergeApiErrorCodeSchema
>;

export interface ConciergeApiErrorResponse {
  ok: false;
  code: ConciergeApiErrorCode;
  requestId: string;
  retryAfterSeconds?: number;
}

export interface ConciergeSessionStatus {
  authenticated: boolean;
  configured: boolean;
}
