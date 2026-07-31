import "server-only";

import { randomUUID } from "node:crypto";
import { getContent } from "@/lib/content";
import type { Locale } from "@/lib/content/types";

import {
  hasFilledInquiryHoneypot,
  parseAvailabilityRequest,
  type AvailabilityValidationIssue,
} from "./contract";
import {
  createResendInquiryDelivery,
  type InquiryDeliveryAdapter,
  type InquiryDeliveryResult,
} from "./delivery";
import {
  consoleInquiryLogger,
  logSafeInquiryError,
  type InquiryLogger,
} from "./errors";
import {
  createSupabaseInquiryPersistence,
  type InquiryPersistenceAdapter,
  type InquiryPersistenceResult,
} from "./supabase";

export const DEFAULT_INQUIRY_FALLBACK = {
  email: "info@lafenicepositano.com",
  phone: "+39 089 875513",
  phoneHref: "tel:+39089875513",
} as const;

export interface InquiryFallbackContact {
  email: string;
  phone: string;
  phoneHref: string;
}

export type PublicInquirySubmissionResult =
  | {
      ok: true;
      status: "accepted";
      requestId: string;
    }
  | {
      ok: false;
      status: "invalid";
      issues: AvailabilityValidationIssue[];
    }
  | {
      ok: false;
      status: "unavailable";
      requestId: string;
      message: string;
      fallback: InquiryFallbackContact;
    };

export interface CreateInquiryServiceOptions {
  delivery?: InquiryDeliveryAdapter;
  persistence?: InquiryPersistenceAdapter;
  logger?: InquiryLogger;
  fallback?: InquiryFallbackContact;
}

export interface InquiryService {
  submit(input: unknown): Promise<PublicInquirySubmissionResult>;
}

function publicUnavailableMessage(locale: Locale): string {
  return getContent(locale).pages.availability.form.errorMessage;
}

function failedDeliveryResult(): InquiryDeliveryResult {
  return { status: "failed", provider: "resend", code: "ADAPTER_FAILURE" };
}

function failedPersistenceResult(): InquiryPersistenceResult {
  return { status: "failed", code: "ADAPTER_FAILURE" };
}

export function createInquiryService(
  options: CreateInquiryServiceOptions = {},
): InquiryService {
  const logger = options.logger ?? consoleInquiryLogger;
  const delivery = options.delivery ?? createResendInquiryDelivery({ logger });
  const persistence =
    options.persistence ?? createSupabaseInquiryPersistence({ logger });
  const fallback = options.fallback ?? DEFAULT_INQUIRY_FALLBACK;

  return {
    async submit(input) {
      // Give bots the same success response without delivering or storing payloads.
      if (hasFilledInquiryHoneypot(input)) {
        return { ok: true, status: "accepted", requestId: randomUUID() };
      }

      const parsed = parseAvailabilityRequest(input);
      if (!parsed.success) {
        return { ok: false, status: "invalid", issues: parsed.issues };
      }

      const requestId = randomUUID();
      const context = { requestId };
      const [deliveryAttempt, persistenceAttempt] = await Promise.allSettled([
        delivery.deliver(parsed.data, context),
        persistence.persist(parsed.data, context),
      ]);

      const deliveryResult =
        deliveryAttempt.status === "fulfilled"
          ? deliveryAttempt.value
          : failedDeliveryResult();
      const persistenceResult =
        persistenceAttempt.status === "fulfilled"
          ? persistenceAttempt.value
          : failedPersistenceResult();

      if (deliveryAttempt.status === "rejected") {
        logSafeInquiryError(logger, {
          scope: "inquiry_delivery",
          operation: "send",
          resource: "resend",
          code: "ADAPTER_FAILURE",
          requestId,
        });
      }

      if (persistenceAttempt.status === "rejected") {
        logSafeInquiryError(logger, {
          scope: "inquiry_persistence",
          operation: "insert",
          resource: "availability_inquiries",
          code: "ADAPTER_FAILURE",
          requestId,
        });
      }

      // Persistence is deliberately non-blocking during the Supabase rollout.
      // Its adapter logs a safe, actionable diagnostic when the schema is absent.
      void persistenceResult;

      if (deliveryResult.status === "sent") {
        return { ok: true, status: "accepted", requestId };
      }

      return {
        ok: false,
        status: "unavailable",
        requestId,
        message: publicUnavailableMessage(parsed.data.locale),
        fallback,
      };
    },
  };
}

export async function submitAvailabilityRequest(
  input: unknown,
  options?: CreateInquiryServiceOptions,
): Promise<PublicInquirySubmissionResult> {
  return createInquiryService(options).submit(input);
}
