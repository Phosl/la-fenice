import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AvailabilityRequest } from "./contract";
import {
  consoleInquiryLogger,
  databaseErrorCode,
  isMissingSchemaError,
  isPermissionDeniedError,
  logSafeInquiryError,
  type DatabaseErrorLike,
  type InquiryLogger,
} from "./errors";

export interface InquiryPersistenceContext {
  requestId?: string;
}

export type InquiryPersistenceResult =
  | { status: "stored"; id: string }
  | { status: "skipped"; reason: "not-configured" }
  | { status: "unavailable"; reason: "missing-schema"; code?: string }
  | { status: "forbidden"; code?: string }
  | { status: "failed"; code?: string };

export interface InquiryPersistenceAdapter {
  persist(
    request: AvailabilityRequest,
    context?: InquiryPersistenceContext,
  ): Promise<InquiryPersistenceResult>;
}

export interface InquirySupabaseEnvironment {
  SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export interface CreateSupabaseInquiryPersistenceOptions {
  env?: InquirySupabaseEnvironment;
  client?: SupabaseClient;
  logger?: InquiryLogger;
}

function unknownErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const name = "name" in error ? String(error.name ?? "").trim() : "";
  return name
    ? name.toUpperCase().replace(/[^A-Z0-9_-]/g, "_").slice(0, 64)
    : undefined;
}

export function createSupabaseInquiryPersistence(
  options: CreateSupabaseInquiryPersistenceOptions = {},
): InquiryPersistenceAdapter {
  const env = options.env ?? process.env;
  const logger = options.logger ?? consoleInquiryLogger;
  const url = (env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const client =
    options.client ??
    (url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        })
      : undefined);

  if (!client) {
    return {
      async persist() {
        return { status: "skipped", reason: "not-configured" };
      },
    };
  }

  return {
    async persist(request, context) {
      try {
        const { data, error } = await client
          .from("availability_inquiries")
          .insert({
            name: request.name,
            email: request.email,
            phone: request.phone ?? null,
            guests: request.guests,
            check_in: request.checkIn,
            check_out: request.checkOut,
            message: request.message ?? null,
            locale: request.locale,
            consent: request.consent,
            source: "website",
          })
          .select("id")
          .single();

        if (!error && data?.id) {
          return { status: "stored", id: String(data.id) };
        }

        const databaseError = error as DatabaseErrorLike | null;
        const code = databaseErrorCode(databaseError);

        logSafeInquiryError(logger, {
          scope: "inquiry_persistence",
          operation: "insert",
          resource: "availability_inquiries",
          code,
          requestId: context?.requestId,
        });

        if (isMissingSchemaError(databaseError)) {
          return { status: "unavailable", reason: "missing-schema", code };
        }

        if (isPermissionDeniedError(databaseError)) {
          return { status: "forbidden", code };
        }

        return { status: "failed", code };
      } catch (error) {
        const code = unknownErrorCode(error);
        logSafeInquiryError(logger, {
          scope: "inquiry_persistence",
          operation: "insert",
          resource: "availability_inquiries",
          code,
          requestId: context?.requestId,
        });
        return { status: "failed", code };
      }
    },
  };
}
