export interface DatabaseErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

export interface InquiryLogger {
  info?(metadata: Record<string, unknown>): void;
  warn?(metadata: Record<string, unknown>): void;
  error?(metadata: Record<string, unknown>): void;
}

const missingSchemaCodes = new Set([
  "42P01",
  "42703",
  "42883",
  "PGRST200",
  "PGRST202",
  "PGRST204",
  "PGRST205",
]);

const permissionDeniedCodes = new Set(["28000", "42501"]);

function normaliseCode(error: DatabaseErrorLike | null | undefined): string | undefined {
  const code = error?.code?.trim().toUpperCase();
  return code && code.length <= 64 ? code : undefined;
}

export function databaseErrorCode(
  error: DatabaseErrorLike | null | undefined,
): string | undefined {
  return normaliseCode(error);
}

export function isMissingSchemaError(
  error: DatabaseErrorLike | null | undefined,
): boolean {
  if (!error) return false;

  const code = normaliseCode(error);
  if (code && missingSchemaCodes.has(code)) return true;
  if (code && permissionDeniedCodes.has(code)) return false;

  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return /schema cache|relation [^ ]+ does not exist|could not find (the )?(table|function|column)|column [^ ]+ does not exist/.test(
    message,
  );
}

export function isPermissionDeniedError(
  error: DatabaseErrorLike | null | undefined,
): boolean {
  if (!error) return false;

  const code = normaliseCode(error);
  if (code && permissionDeniedCodes.has(code)) return true;

  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return /permission denied|row-level security|violates row level security/.test(message);
}

export function logSafeInquiryError(
  logger: InquiryLogger,
  metadata: {
    scope: "inquiry_delivery" | "inquiry_persistence";
    operation: "send" | "insert";
    resource: "resend" | "availability_inquiries";
    code?: string;
    requestId?: string;
  },
): void {
  logger.error?.({
    ...metadata,
    code: metadata.code ?? "UNKNOWN",
  });
}

export const consoleInquiryLogger: InquiryLogger = {
  info: (metadata) => console.info(metadata),
  warn: (metadata) => console.warn(metadata),
  error: (metadata) => console.error(metadata),
};
