import "server-only";

import { Resend } from "resend";

import type { AvailabilityRequest } from "./contract";
import {
  consoleInquiryLogger,
  logSafeInquiryError,
  type InquiryLogger,
} from "./errors";

const DEFAULT_RECIPIENT = "info@lafenicepositano.com";

export interface InquiryDeliveryContext {
  requestId?: string;
}

export type InquiryDeliveryResult =
  | { status: "sent"; provider: "resend"; messageId?: string }
  | { status: "skipped"; provider: "resend"; reason: "not-configured" }
  | { status: "failed"; provider: "resend"; code?: string };

export interface InquiryDeliveryAdapter {
  deliver(
    request: AvailabilityRequest,
    context?: InquiryDeliveryContext,
  ): Promise<InquiryDeliveryResult>;
}

interface ResendErrorLike {
  name?: string;
}

interface ResendClientLike {
  emails: {
    send(message: {
      from: string;
      to: string[];
      replyTo: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<{
      data: { id?: string } | null;
      error: ResendErrorLike | null;
    }>;
  };
}

export interface InquiryDeliveryEnvironment {
  RESEND_API_KEY?: string;
  INQUIRY_FROM_EMAIL?: string;
  INQUIRY_TO_EMAIL?: string;
}

export interface CreateResendInquiryDeliveryOptions {
  env?: InquiryDeliveryEnvironment;
  client?: ResendClientLike;
  logger?: InquiryLogger;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function line(label: string, value: string | number | undefined): string {
  return `${label}: ${value || "—"}`;
}

function buildMessage(request: AvailabilityRequest): {
  subject: string;
  text: string;
  html: string;
} {
  const labels =
    request.locale === "it"
      ? {
          subject: "Nuova richiesta di disponibilità",
          name: "Nome",
          email: "Email",
          phone: "Telefono",
          guests: "Ospiti",
          checkIn: "Arrivo",
          checkOut: "Partenza",
          message: "Messaggio",
          locale: "Lingua",
        }
      : {
          subject: "New availability request",
          name: "Name",
          email: "Email",
          phone: "Phone",
          guests: "Guests",
          checkIn: "Check-in",
          checkOut: "Check-out",
          message: "Message",
          locale: "Language",
        };

  const rows = [
    line(labels.name, request.name),
    line(labels.email, request.email),
    line(labels.phone, request.phone),
    line(labels.guests, request.guests),
    line(labels.checkIn, request.checkIn),
    line(labels.checkOut, request.checkOut),
    line(labels.locale, request.locale.toUpperCase()),
    "",
    line(labels.message, request.message),
  ];

  const htmlRows = rows
    .map((row) => (row ? `<p>${escapeHtml(row)}</p>` : "<br>"))
    .join("");

  return {
    subject: `${labels.subject} · ${request.checkIn} → ${request.checkOut}`,
    text: rows.join("\n"),
    html: `<div>${htmlRows}</div>`,
  };
}

function safeDeliveryCode(error: unknown): string | undefined {
  const candidate =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";
  const code = candidate.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
  return code ? code.slice(0, 64) : undefined;
}

export function createResendInquiryDelivery(
  options: CreateResendInquiryDeliveryOptions = {},
): InquiryDeliveryAdapter {
  const env = options.env ?? process.env;
  const logger = options.logger ?? consoleInquiryLogger;
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.INQUIRY_FROM_EMAIL?.trim();
  const to = env.INQUIRY_TO_EMAIL?.trim() || DEFAULT_RECIPIENT;
  const client = options.client ??
    (apiKey ? (new Resend(apiKey) as unknown as ResendClientLike) : undefined);

  if (!client || !from) {
    return {
      async deliver() {
        return { status: "skipped", provider: "resend", reason: "not-configured" };
      },
    };
  }

  return {
    async deliver(request, context) {
      const message = buildMessage(request);

      try {
        const { data, error } = await client.emails.send({
          from,
          to: [to],
          replyTo: request.email,
          ...message,
        });

        if (error) {
          const code = safeDeliveryCode(error);
          logSafeInquiryError(logger, {
            scope: "inquiry_delivery",
            operation: "send",
            resource: "resend",
            code,
            requestId: context?.requestId,
          });
          return { status: "failed", provider: "resend", code };
        }

        return {
          status: "sent",
          provider: "resend",
          ...(data?.id ? { messageId: data.id } : {}),
        };
      } catch (error) {
        const code = safeDeliveryCode(error);
        logSafeInquiryError(logger, {
          scope: "inquiry_delivery",
          operation: "send",
          resource: "resend",
          code,
          requestId: context?.requestId,
        });
        return { status: "failed", provider: "resend", code };
      }
    },
  };
}
