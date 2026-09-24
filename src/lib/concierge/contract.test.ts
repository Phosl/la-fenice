// @vitest-environment node

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  CONCIERGE_STORED_MESSAGE_LIMIT,
  clearConciergeConversation,
  createConciergeConversation,
  loadConciergeConversation,
  saveConciergeConversation,
} from "@/components/demo/guest/concierge-storage";

import {
  CONCIERGE_MAX_GUIDE_ITEMS,
  CONCIERGE_MAX_HISTORY,
  CONCIERGE_MAX_MESSAGE_LENGTH,
  CONCIERGE_MAX_REPLY_LENGTH,
  conciergeApiErrorCodeSchema,
  conciergeAssistantOutputSchema,
  conciergeChatRequestSchema,
  conciergeChatResponseSchema,
  conciergeGuideItemSchema,
  conciergeSessionRequestSchema,
  conciergeSpeechRequestSchema,
} from "./contract";

const guideItem = {
  id: "guide-le-tre-sorelle",
  category: "dining" as const,
  label: "Le Tre Sorelle",
  description: "A family-run restaurant by the beach.",
  address: "Via del Brigantino 27, Positano",
  bookingNote: "Ask the team to confirm availability.",
  requestable: true,
};

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("concierge chat contract", () => {
  it.each(["en", "it", "de", "ru"] as const)(
    "accepts a bounded %s request and applies defaults",
    (locale) => {
      const result = conciergeChatRequestSchema.parse({
        locale,
        message: "  Where can we have dinner?  ",
        guide: [guideItem],
      });

      expect(result).toEqual({
        locale,
        message: "Where can we have dinner?",
        category: "all",
        history: [],
        guide: [guideItem],
      });
    },
  );

  it("accepts every guide category as a manual filter", () => {
    const categories = [
      "all",
      "dining",
      "after-dark",
      "sea",
      "see",
      "getting-around",
      "essentials",
    ] as const;

    for (const category of categories) {
      expect(
        conciergeChatRequestSchema.safeParse({
          locale: "it",
          message: "Un consiglio, per favore",
          category,
          guide: [guideItem],
        }).success,
      ).toBe(true);
    }
  });

  it("accepts the longest valid assistant reply in subsequent history", () => {
    const output = conciergeAssistantOutputSchema.parse({
      answer: "x".repeat(CONCIERGE_MAX_REPLY_LENGTH),
      recommendationIds: [],
      suggestedPrompts: [],
    });

    expect(
      conciergeChatRequestSchema.safeParse({
        locale: "it",
        message: "Un altro consiglio",
        guide: [guideItem],
        history: [{ role: "assistant", content: output.answer }],
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported locales, filters and unknown fields", () => {
    const base = {
      locale: "it",
      message: "Un consiglio",
      guide: [guideItem],
    };

    expect(
      conciergeChatRequestSchema.safeParse({ ...base, locale: "fr" }).success,
    ).toBe(false);
    expect(
      conciergeChatRequestSchema.safeParse({ ...base, category: "shopping" })
        .success,
    ).toBe(false);
    expect(
      conciergeChatRequestSchema.safeParse({ ...base, promptOverride: "ignore" })
        .success,
    ).toBe(false);
  });

  it("enforces message, history and guide bounds", () => {
    const base = {
      locale: "en" as const,
      message: "Dinner",
      guide: [guideItem],
    };

    expect(
      conciergeChatRequestSchema.safeParse({ ...base, message: " " }).success,
    ).toBe(false);
    expect(
      conciergeChatRequestSchema.safeParse({
        ...base,
        message: "x".repeat(CONCIERGE_MAX_MESSAGE_LENGTH + 1),
      }).success,
    ).toBe(false);
    expect(
      conciergeChatRequestSchema.safeParse({
        ...base,
        history: Array.from({ length: CONCIERGE_MAX_HISTORY + 1 }, () => ({
          role: "user",
          content: "A previous question",
        })),
      }).success,
    ).toBe(false);
    expect(
      conciergeChatRequestSchema.safeParse({ ...base, guide: [] }).success,
    ).toBe(false);
    expect(
      conciergeChatRequestSchema.safeParse({
        ...base,
        guide: Array.from(
          { length: CONCIERGE_MAX_GUIDE_ITEMS + 1 },
          (_, index) => ({ ...guideItem, id: `guide-${index}` }),
        ),
      }).success,
    ).toBe(false);
  });

  it("accepts only strict, localized guide context data", () => {
    expect(conciergeGuideItemSchema.parse(guideItem)).toEqual(guideItem);
    expect(
      conciergeGuideItemSchema.safeParse({ ...guideItem, websiteUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      conciergeGuideItemSchema.safeParse({ ...guideItem, requestable: "yes" })
        .success,
    ).toBe(false);
    expect(
      conciergeGuideItemSchema.safeParse({ ...guideItem, description: "x".repeat(701) })
        .success,
    ).toBe(false);
  });
});

describe("concierge assistant and speech contracts", () => {
  const assistantOutput = {
    answer: "Le Tre Sorelle is a relaxed option by the main beach.",
    recommendationIds: [guideItem.id],
    suggestedPrompts: ["Something quieter", "A place by the sea"],
  };

  it("accepts a structured assistant response and trims its copy", () => {
    expect(
      conciergeAssistantOutputSchema.parse({
        ...assistantOutput,
        answer: `  ${assistantOutput.answer}  `,
      }),
    ).toEqual(assistantOutput);

    expect(
      conciergeChatResponseSchema.parse({
        ...assistantOutput,
        requestId: "req-demo",
        messageId: "msg-demo",
        speechToken: "signed-speech-token",
      }),
    ).toMatchObject({
      recommendationIds: [guideItem.id],
      requestId: "req-demo",
      messageId: "msg-demo",
    });
  });

  it("rejects oversized, empty or unstructured assistant output", () => {
    expect(
      conciergeAssistantOutputSchema.safeParse({
        ...assistantOutput,
        answer: " ",
      }).success,
    ).toBe(false);
    expect(
      conciergeAssistantOutputSchema.safeParse({
        ...assistantOutput,
        recommendationIds: ["one", "two", "three", "four", "five"],
      }).success,
    ).toBe(false);
    expect(
      conciergeAssistantOutputSchema.safeParse({
        ...assistantOutput,
        unsafeHtml: "<script>alert(1)</script>",
      }).success,
    ).toBe(false);
    expect(
      conciergeChatResponseSchema.safeParse({
        ...assistantOutput,
        requestId: "req-demo",
        messageId: "msg-demo",
      }).success,
    ).toBe(false);
  });

  it.each(["female", "male"] as const)(
    "accepts the %s semantic voice profile for every supported language",
    (voice) => {
      for (const locale of ["en", "it", "de", "ru"] as const) {
        expect(
          conciergeSpeechRequestSchema.parse({
            locale,
            voice,
            messageId: "msg-demo",
            text: "Welcome to Positano.",
            speechToken: "signed-speech-token",
          }),
        ).toMatchObject({ locale, voice });
      }
    },
  );

  it("rejects arbitrary voices, missing tokens and extra provider controls", () => {
    const speech = {
      locale: "it",
      voice: "female",
      messageId: "msg-demo",
      text: "Benvenuti a Positano.",
      speechToken: "signed-speech-token",
    };

    expect(
      conciergeSpeechRequestSchema.safeParse({ ...speech, voice: "alloy" })
        .success,
    ).toBe(false);
    expect(
      conciergeSpeechRequestSchema.safeParse({ ...speech, speechToken: "" })
        .success,
    ).toBe(false);
    expect(
      conciergeSpeechRequestSchema.safeParse({ ...speech, model: "custom-model" })
        .success,
    ).toBe(false);
  });
});

describe("concierge session and public errors", () => {
  it("normalises only the login code and rejects additional session data", () => {
    expect(
      conciergeSessionRequestSchema.parse({
        loginCode: "  cliente  ",
        password: " cliente ",
      }),
    ).toEqual({ loginCode: "cliente", password: " cliente " });

    expect(
      conciergeSessionRequestSchema.safeParse({
        loginCode: "cliente",
        password: "cliente",
        role: "admin",
      }).success,
    ).toBe(false);
  });

  it("keeps the public error vocabulary closed", () => {
    for (const code of [
      "invalid_request",
      "invalid_origin",
      "not_authenticated",
      "not_configured",
      "rate_limited",
      "content_blocked",
      "provider_unavailable",
      "invalid_speech_token",
    ]) {
      expect(conciergeApiErrorCodeSchema.safeParse(code).success).toBe(true);
    }

    expect(conciergeApiErrorCodeSchema.safeParse("openai_api_key_missing").success)
      .toBe(false);
  });
});

describe("concierge tab-scoped conversation storage", () => {
  let sessionStorage: MemoryStorage;

  beforeEach(() => {
    sessionStorage = new MemoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage },
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("starts with the stay locale and the default female voice", () => {
    expect(createConciergeConversation("stay-demo", "de")).toMatchObject({
      version: 1,
      stayId: "stay-demo",
      locale: "de",
      voice: "female",
      messages: [],
    });
  });

  it("persists manual language, voice and completed messages per stay", () => {
    const conversation = {
      ...createConciergeConversation("stay-demo", "it"),
      locale: "ru" as const,
      voice: "male" as const,
      messages: [
        {
          id: "message-user",
          role: "user" as const,
          content: "Где можно спокойно поужинать?",
          locale: "ru" as const,
          recommendationIds: [],
          suggestedPrompts: [],
          createdAt: "2026-08-02T10:00:00.000Z",
        },
        {
          id: "message-assistant",
          role: "assistant" as const,
          content: "Можно посмотреть Le Tre Sorelle.",
          locale: "ru" as const,
          recommendationIds: [guideItem.id],
          suggestedPrompts: ["Что-нибудь потише"],
          speechToken: "signed-token",
          createdAt: "2026-08-02T10:00:01.000Z",
        },
      ],
    };

    expect(saveConciergeConversation(conversation)).toBe(true);
    expect(loadConciergeConversation("stay-demo", "en")).toMatchObject({
      locale: "ru",
      voice: "male",
      messages: [
        { id: "message-user" },
        {
          id: "message-assistant",
          recommendationIds: [guideItem.id],
          speechToken: "signed-token",
        },
      ],
    });
    expect(loadConciergeConversation("another-stay", "en").messages).toEqual(
      [],
    );
  });

  it("keeps only the newest bounded messages", () => {
    const conversation = {
      ...createConciergeConversation("stay-demo", "en"),
      messages: Array.from({ length: 24 }, (_, index) => ({
        id: `message-${index}`,
        role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: `Message ${index}`,
        locale: "en" as const,
        recommendationIds: [],
        suggestedPrompts: [],
        createdAt: `2026-08-02T10:00:${String(index).padStart(2, "0")}.000Z`,
      })),
    };

    expect(saveConciergeConversation(conversation)).toBe(true);
    const stored = loadConciergeConversation("stay-demo", "en");
    expect(stored.messages).toHaveLength(CONCIERGE_STORED_MESSAGE_LIMIT);
    expect(stored.messages[0].id).toBe(
      `message-${24 - CONCIERGE_STORED_MESSAGE_LIMIT}`,
    );
    expect(stored.messages.at(-1)?.id).toBe("message-23");
  });

  it("clears messages without losing the manual language or voice", () => {
    const previous = {
      ...createConciergeConversation("stay-demo", "it"),
      locale: "de" as const,
      voice: "male" as const,
      messages: [
        {
          id: "old-message",
          role: "user" as const,
          content: "Ein Restaurant",
          locale: "de" as const,
          recommendationIds: [],
          suggestedPrompts: [],
          createdAt: "2026-08-02T10:00:00.000Z",
        },
      ],
    };
    saveConciergeConversation(previous);

    expect(clearConciergeConversation("stay-demo", "de", "male")).toMatchObject(
      {
        locale: "de",
        voice: "male",
        messages: [],
      },
    );
    expect(loadConciergeConversation("stay-demo", "it")).toMatchObject({
      locale: "de",
      voice: "male",
      messages: [],
    });
  });

  it("falls back safely when session storage is malformed or unavailable", () => {
    sessionStorage.setItem(
      "la-fenice:concierge:v1:stay-demo",
      JSON.stringify({ version: 1, stayId: "different-stay" }),
    );
    expect(loadConciergeConversation("stay-demo", "it")).toMatchObject({
      locale: "it",
      voice: "female",
      messages: [],
    });

    sessionStorage.getItem = () => {
      throw new Error("Storage unavailable");
    };
    expect(loadConciergeConversation("stay-demo", "ru")).toMatchObject({
      locale: "ru",
      messages: [],
    });

    sessionStorage.setItem = () => {
      throw new Error("Quota exceeded");
    };
    expect(
      saveConciergeConversation(createConciergeConversation("stay-demo", "it")),
    ).toBe(false);
  });
});
