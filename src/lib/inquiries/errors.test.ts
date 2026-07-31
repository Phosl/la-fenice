// @vitest-environment node

import { describe, expect, it } from "vitest";

import { isMissingSchemaError, isPermissionDeniedError } from "./errors";

describe("Supabase error classification", () => {
  it.each(["42P01", "42703", "42883", "PGRST204", "PGRST205"])(
    "classifies %s as missing schema",
    (code) => {
      expect(isMissingSchemaError({ code })).toBe(true);
    },
  );

  it("uses a narrow message fallback when no structured code exists", () => {
    expect(
      isMissingSchemaError({
        message: "Could not find the table public.availability_inquiries in the schema cache",
      }),
    ).toBe(true);
  });

  it("never mistakes insufficient privileges for missing schema", () => {
    const error = {
      code: "42501",
      message: "relation public.availability_inquiries does not exist",
    };

    expect(isMissingSchemaError(error)).toBe(false);
    expect(isPermissionDeniedError(error)).toBe(true);
  });

  it("classifies RLS failures as permission failures", () => {
    expect(
      isPermissionDeniedError({
        message: "new row violates row-level security policy",
      }),
    ).toBe(true);
  });
});
