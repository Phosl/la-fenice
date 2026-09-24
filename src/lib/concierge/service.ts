import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  conciergeAssistantOutputSchema,
  type ConciergeAssistantOutput,
  type ConciergeChatRequest,
  type ConciergeSpeechRequest,
} from "./contract";
import type { ConciergeServerConfig } from "./config";
import {
  buildConciergeInstructions,
  buildConciergeUserInput,
  getConciergeSafetyOutput,
  getOpenAIVoice,
  getSpeechInstructions,
  visibleGuideItems,
} from "./prompt";

export type ConciergeServiceFailure = "provider_unavailable";

export class ConciergeServiceError extends Error {
  constructor(
    public readonly code: ConciergeServiceFailure,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "ConciergeServiceError";
  }
}

export interface ConciergeChatResult {
  output: ConciergeAssistantOutput;
  safetyFallback: boolean;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

function createOpenAIClient(config: ConciergeServerConfig): OpenAI {
  if (!config.apiKey) throw new ConciergeServiceError("provider_unavailable");
  return new OpenAI({
    apiKey: config.apiKey,
    maxRetries: 1,
    timeout: 20_000,
  });
}

function deduplicate(values: readonly string[], maximum: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(
    0,
    maximum,
  );
}

function normaliseOutput(
  output: ConciergeAssistantOutput,
  request: ConciergeChatRequest,
): ConciergeAssistantOutput {
  const allowedIds = new Set(visibleGuideItems(request).map((item) => item.id));
  return {
    answer: output.answer.trim(),
    recommendationIds: deduplicate(output.recommendationIds, 4).filter((id) =>
      allowedIds.has(id),
    ),
    suggestedPrompts: deduplicate(output.suggestedPrompts, 3),
  };
}

export async function createConciergeChat(
  request: ConciergeChatRequest,
  options: {
    config: ConciergeServerConfig;
    safetyIdentifier: string;
    signal?: AbortSignal;
  },
): Promise<ConciergeChatResult> {
  const client = createOpenAIClient(options.config);

  try {
    const moderation = await client.moderations.create(
      {
        model: "omni-moderation-latest",
        input: [
          ...request.history.map((message) => message.content),
          request.message,
        ],
      },
      { signal: options.signal },
    );
    if (moderation.results.some((result) => result.flagged)) {
      return {
        output: getConciergeSafetyOutput(request.locale),
        safetyFallback: true,
        usage: {},
      };
    }

    const response = await client.responses.parse(
      {
        model: options.config.chatModel,
        reasoning: { effort: "low", context: "current_turn" },
        store: false,
        safety_identifier: options.safetyIdentifier,
        instructions: buildConciergeInstructions(request),
        input: [
          {
            role: "user" as const,
            content: buildConciergeUserInput(request),
          },
        ],
        max_output_tokens: 500,
        text: {
          verbosity: "low",
          format: zodTextFormat(
            conciergeAssistantOutputSchema,
            "positano_concierge_answer",
          ),
        },
      },
      { signal: options.signal },
    );

    if (!response.output_parsed) {
      const refused = response.output.some(
        (item) =>
          item.type === "message" &&
          item.content.some((content) => content.type === "refusal"),
      );
      if (refused) {
        return {
          output: getConciergeSafetyOutput(request.locale),
          safetyFallback: true,
          usage: {
            inputTokens: response.usage?.input_tokens,
            outputTokens: response.usage?.output_tokens,
          },
        };
      }
      throw new ConciergeServiceError("provider_unavailable");
    }

    return {
      output: normaliseOutput(response.output_parsed, request),
      safetyFallback: false,
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof ConciergeServiceError) throw error;
    throw new ConciergeServiceError("provider_unavailable", { cause: error });
  }
}

export async function createConciergeSpeech(
  request: ConciergeSpeechRequest,
  options: {
    config: ConciergeServerConfig;
    signal?: AbortSignal;
  },
): Promise<Response> {
  const client = createOpenAIClient(options.config);

  try {
    return await client.audio.speech.create(
      {
        model: options.config.ttsModel,
        voice: getOpenAIVoice(request.voice),
        input: request.text,
        instructions: getSpeechInstructions(request.locale, request.voice),
        response_format: "mp3",
        stream_format: "audio",
      },
      { signal: options.signal },
    );
  } catch (error) {
    throw new ConciergeServiceError("provider_unavailable", { cause: error });
  }
}
