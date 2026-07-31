import { z } from "zod";
import { supportedLocales } from "@/lib/content/routes";

export const inquiryLocales = supportedLocales;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const isoDateSchema = z
  .string()
  .trim()
  .refine(isCalendarDate, "Use a valid date in YYYY-MM-DD format.");

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) =>
      value === null ||
      (typeof value === "string" && value.trim().length === 0)
        ? undefined
        : value,
    z.string().trim().max(maxLength).optional(),
  );

const consentSchema = z.preprocess((value) => {
  if (value === true) return true;
  if (typeof value !== "string") return value;

  return ["1", "on", "true", "yes"].includes(value.toLowerCase())
    ? true
    : value;
}, z.literal(true, { message: "Consent is required." }));

const availabilityRequestShape = {
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: optionalTrimmedString(40),
  guests: z.coerce.number().int().min(1).max(20),
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  message: optionalTrimmedString(2_000),
  locale: z.enum(inquiryLocales),
  consent: consentSchema,
} satisfies z.ZodRawShape;

function validateDateRange(
  value: { checkIn: string; checkOut: string },
  context: z.RefinementCtx,
): void {
  if (
    isCalendarDate(value.checkIn) &&
    isCalendarDate(value.checkOut) &&
    value.checkOut <= value.checkIn
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["checkOut"],
      message: "Check-out must be after check-in.",
    });
  }
}

export const availabilityRequestSchema = z
  .object(availabilityRequestShape)
  .strict()
  .superRefine(validateDateRange);

/**
 * The hidden `website` field is intentionally not part of AvailabilityRequest.
 * It is a honeypot accepted only when empty and is stripped after parsing.
 */
const availabilityRequestSubmissionSchema = z
  .object({
    ...availabilityRequestShape,
    website: z.preprocess(
      (value) => (value === null ? undefined : value),
      z.string().trim().max(0).optional(),
    ),
  })
  .strict()
  .superRefine(validateDateRange);

export type AvailabilityRequest = z.output<typeof availabilityRequestSchema>;
export type AvailabilityRequestInput = z.input<typeof availabilityRequestSchema>;
export type AvailabilityRequestField = keyof AvailabilityRequest | "form";

export interface AvailabilityValidationIssue {
  field: AvailabilityRequestField;
  code: string;
  message: string;
}

export type AvailabilityRequestParseResult =
  | { success: true; data: AvailabilityRequest }
  | { success: false; issues: AvailabilityValidationIssue[] };

const submissionFields = [
  "name",
  "email",
  "phone",
  "guests",
  "checkIn",
  "checkOut",
  "message",
  "locale",
  "consent",
  "website",
] as const;

type FormDataLike = { get(name: string): unknown };

function isFormDataLike(value: unknown): value is FormDataLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    typeof (value as FormDataLike).get === "function"
  );
}

function normaliseSubmissionInput(input: unknown): unknown {
  if (!isFormDataLike(input)) return input;

  return Object.fromEntries(
    submissionFields.map((field) => [field, input.get(field)]),
  );
}

export function hasFilledInquiryHoneypot(input: unknown): boolean {
  const normalised = normaliseSubmissionInput(input);

  if (typeof normalised !== "object" || normalised === null) return false;

  const website = (normalised as Record<string, unknown>).website;
  return typeof website === "string" && website.trim().length > 0;
}

export function parseAvailabilityRequest(
  input: unknown,
): AvailabilityRequestParseResult {
  const result = availabilityRequestSubmissionSchema.safeParse(
    normaliseSubmissionInput(input),
  );

  if (!result.success) {
    return {
      success: false,
      issues: result.error.issues.map((issue) => {
        const candidate = String(issue.path[0] ?? "form");
        const field = submissionFields.includes(
          candidate as (typeof submissionFields)[number],
        )
          ? candidate === "website"
            ? "form"
            : (candidate as AvailabilityRequestField)
          : "form";

        return { field, code: issue.code, message: issue.message };
      }),
    };
  }

  const { website: _honeypot, ...request } = result.data;
  void _honeypot;
  return { success: true, data: request };
}
