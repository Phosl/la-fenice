// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { InquiryDeliveryAdapter } from "./delivery";
import { createInquiryService } from "./service";
import type { InquiryPersistenceAdapter } from "./supabase";

const validSubmission = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "",
  guests: "2",
  checkIn: "2027-05-10",
  checkOut: "2027-05-14",
  message: "A quiet room, please.",
  locale: "en",
  consent: true,
  website: "",
};

function serviceWith(
  delivery: InquiryDeliveryAdapter,
  persistence: InquiryPersistenceAdapter,
) {
  return createInquiryService({
    delivery,
    persistence,
    logger: { error: vi.fn() },
  });
}

describe("inquiry service rollout behavior", () => {
  it("accepts an emailed inquiry when the Supabase schema is missing", async () => {
    const service = serviceWith(
      { deliver: vi.fn().mockResolvedValue({ status: "sent", provider: "resend" }) },
      {
        persist: vi.fn().mockResolvedValue({
          status: "unavailable",
          reason: "missing-schema",
          code: "PGRST205",
        }),
      },
    );

    await expect(service.submit(validSubmission)).resolves.toMatchObject({
      ok: true,
      status: "accepted",
    });
  });

  it("returns only safe contact fallback when delivery fails", async () => {
    const service = serviceWith(
      {
        deliver: vi.fn().mockResolvedValue({
          status: "failed",
          provider: "resend",
          code: "INTERNAL_PROVIDER_DETAIL",
        }),
      },
      { persist: vi.fn().mockResolvedValue({ status: "stored", id: "row-id" }) },
    );

    const result = await service.submit(validSubmission);

    expect(result).toMatchObject({
      ok: false,
      status: "unavailable",
      fallback: { email: "info@lafenicepositano.com" },
    });
    expect(JSON.stringify(result)).not.toContain("INTERNAL_PROVIDER_DETAIL");
  });

  it("silently suppresses honeypot submissions", async () => {
    const delivery = { deliver: vi.fn() } satisfies InquiryDeliveryAdapter;
    const persistence = { persist: vi.fn() } satisfies InquiryPersistenceAdapter;
    const service = serviceWith(delivery, persistence);

    const result = await service.submit({
      ...validSubmission,
      website: "https://spam.test",
    });

    expect(result).toMatchObject({ ok: true, status: "accepted" });
    expect(delivery.deliver).not.toHaveBeenCalled();
    expect(persistence.persist).not.toHaveBeenCalled();
  });
});
