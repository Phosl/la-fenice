// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  hasFilledInquiryHoneypot,
  parseAvailabilityRequest,
} from "./contract";

const validSubmission = {
  name: "  Ada Lovelace  ",
  email: " ADA@EXAMPLE.COM ",
  phone: "",
  guests: "2",
  checkIn: "2027-05-10",
  checkOut: "2027-05-14",
  message: "",
  locale: "en",
  consent: "on",
  website: "",
};

describe("parseAvailabilityRequest", () => {
  it("normalises a valid form-like payload", () => {
    const result = parseAvailabilityRequest(validSubmission);

    expect(result).toEqual({
      success: true,
      data: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: undefined,
        guests: 2,
        checkIn: "2027-05-10",
        checkOut: "2027-05-14",
        message: undefined,
        locale: "en",
        consent: true,
      },
    });
  });

  it("rejects impossible dates and reversed stays", () => {
    const impossible = parseAvailabilityRequest({
      ...validSubmission,
      checkIn: "2027-02-30",
    });
    const reversed = parseAvailabilityRequest({
      ...validSubmission,
      checkOut: "2027-05-09",
    });

    expect(impossible.success).toBe(false);
    expect(reversed.success).toBe(false);
    if (!reversed.success) {
      expect(reversed.issues).toContainEqual(
        expect.objectContaining({ field: "checkOut" }),
      );
    }
  });

  it("rejects missing consent and out-of-range guest counts", () => {
    const result = parseAvailabilityRequest({
      ...validSubmission,
      guests: "21",
      consent: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map((issue) => issue.field)).toEqual(
        expect.arrayContaining(["guests", "consent"]),
      );
    }
  });

  it("detects a filled honeypot independently from validation", () => {
    expect(
      hasFilledInquiryHoneypot({ ...validSubmission, website: "spam.test" }),
    ).toBe(true);
    expect(hasFilledInquiryHoneypot(validSubmission)).toBe(false);
  });

  it.each(["en", "it", "de", "ru"] as const)(
    "accepts the supported %s locale",
    (locale) => {
      const result = parseAvailabilityRequest({ ...validSubmission, locale });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.locale).toBe(locale);
    },
  );
});
