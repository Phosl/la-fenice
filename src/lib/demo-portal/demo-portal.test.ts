// @vitest-environment node

import { beforeAll, describe, expect, it } from "vitest";

import {
  addDemoDays,
  assertValidStayRange,
  getRomeToday,
  isStayDateOrderable,
  listStayCalendarDates,
} from "./dates";
import {
  cancelGuestRequest,
  createGuestActivityRequest,
  createGuestGuideRequest,
  createGuestOrder,
  replaceAccountPasswordHash,
  saveAdminCatalogItem,
  updateAdminRequest,
  updateAdminStay,
} from "./operations";
import {
  authenticateDemoAccount,
  hashDemoPassword,
  isDemoSessionCurrent,
  normaliseLoginCode,
  verifyDemoPassword,
} from "./security";
import {
  DEMO_ADMIN_CREDENTIALS,
  DEMO_GUEST_CREDENTIALS,
  createDemoPortalSeed,
  refreshDemoStayForToday,
} from "./seed";
import type {
  DemoCatalogItemInput,
  DemoPortalState,
  DemoSession,
} from "./types";
import { DemoPortalError } from "./types";

const fixedNow = new Date("2026-08-01T10:00:00.000Z");
let seed: DemoPortalState;

beforeAll(async () => {
  seed = await createDemoPortalSeed(fixedNow);
});

const guestSession = (): DemoSession => ({
  accountId: "demo-guest-account",
  loginCode: normaliseLoginCode(DEMO_GUEST_CREDENTIALS.loginCode),
  role: "guest",
  credentialVersion: 1,
  createdAt: fixedNow.toISOString(),
});

const adminSession = (): DemoSession => ({
  accountId: "demo-admin-account",
  loginCode: normaliseLoginCode(DEMO_ADMIN_CREDENTIALS.loginCode),
  role: "admin",
  credentialVersion: 1,
  createdAt: fixedNow.toISOString(),
});

describe("demo calendar", () => {
  it("uses the Europe/Rome date across the UTC boundary", () => {
    expect(getRomeToday(new Date("2026-07-31T22:30:00.000Z"))).toBe("2026-08-01");
    expect(addDemoDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("includes check-out in the calendar but excludes it from requests", () => {
    const stay = seed.stays[0];
    const dates = listStayCalendarDates(stay);

    expect(dates.at(-1)).toBe(stay.checkOut);
    expect(isStayDateOrderable(stay, "2026-08-01", "2026-08-01")).toBe(true);
    expect(isStayDateOrderable(stay, stay.checkOut, "2026-08-01")).toBe(false);
    expect(isStayDateOrderable(stay, "2026-07-31", "2026-08-01")).toBe(false);
  });

  it("caps stays at 60 nights", () => {
    expect(() => assertValidStayRange("2026-08-01", "2026-09-30")).not.toThrow();
    expect(() => assertValidStayRange("2026-08-01", "2026-10-01")).toThrowError(
      /60 nights/,
    );
  });
});

describe("demo seed and credentials", () => {
  it("creates an active stay around today and the complete catalog", () => {
    const stay = seed.stays[0];
    const guide = seed.catalog.filter((item) => item.kind === "guide");

    expect(stay.checkIn).toBe("2026-07-30");
    expect(stay.checkOut).toBe("2026-08-05");
    expect(seed.catalog.filter(({ kind }) => kind === "product")).toHaveLength(8);
    expect(seed.catalog.filter(({ kind }) => kind === "activity")).toHaveLength(3);
    expect(guide).toHaveLength(24);
    expect(guide.filter((item) => item.requestable)).toHaveLength(7);
    expect(
      Object.fromEntries(
        ["dining", "after-dark", "sea", "see", "getting-around", "essentials"].map(
          (category) => [category, guide.filter((item) => item.category === category).length],
        ),
      ),
    ).toEqual({
      dining: 7,
      "after-dark": 3,
      sea: 6,
      see: 4,
      "getting-around": 2,
      essentials: 2,
    });
    for (const item of guide) {
      for (const locale of ["en", "it", "de", "ru"] as const) {
        expect(item.labels[locale].trim()).not.toBe("");
        expect(item.description?.[locale].trim()).not.toBe("");
      }
    }
    expect(seed.guideRequests).toEqual([]);
    expect(seed.accounts.find(({ role }) => role === "guest")?.passwordHash)
      .not.toContain(DEMO_GUEST_CREDENTIALS.password);
    expect(seed.accounts.find(({ role }) => role === "admin")?.passwordHash)
      .not.toContain(DEMO_ADMIN_CREDENTIALS.password);
  });

  it("moves only the built-in stay when today falls outside it", () => {
    const withGuideRequest = createGuestGuideRequest(
      seed,
      guestSession(),
      {
        guideItemId: "guide-le-tre-sorelle",
        requestedDate: "2026-08-02",
        preferredTime: "20:00",
        participants: 2,
      },
      "2026-08-01",
      fixedNow,
    ).state;
    const next = refreshDemoStayForToday(
      {
        ...structuredClone(withGuideRequest),
        orders: [
          {
            id: "old",
            stayId: "demo-stay",
            serviceDate: "2026-08-01",
            location: "room",
            requestedTime: "12:00",
            notes: "",
            lines: [],
            status: "pending",
            staffNote: "",
            createdAt: fixedNow.toISOString(),
            updatedAt: fixedNow.toISOString(),
          },
        ],
      },
      new Date("2027-01-10T12:00:00.000Z"),
    );

    expect(next.stays[0].checkIn).toBe("2027-01-08");
    expect(next.stays[0].checkOut).toBe("2027-01-14");
    expect(next.orders).toHaveLength(0);
    expect(next.guideRequests).toHaveLength(0);
  });

  it("stops auto-anchoring after an admin explicitly changes demo stay dates", () => {
    const manuallyDated = updateAdminStay(
      seed,
      adminSession(),
      "demo-stay",
      { checkIn: "2026-08-10", checkOut: "2026-08-15" },
      fixedNow,
    );
    const refreshed = refreshDemoStayForToday(
      manuallyDated,
      new Date("2027-01-10T12:00:00.000Z"),
    );

    expect(manuallyDated.stays[0].autoAnchorToToday).toBe(false);
    expect(refreshed).toBe(manuallyDated);
    expect(refreshed.stays[0].checkIn).toBe("2026-08-10");
  });

  it("hashes and verifies passwords with Web Crypto", async () => {
    const hash = await hashDemoPassword(
      "TestPassword!",
      "00112233445566778899aabbccddeeff",
    );

    expect(hash).not.toContain("TestPassword!");
    await expect(verifyDemoPassword("TestPassword!", hash)).resolves.toBe(true);
    await expect(verifyDemoPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("authenticates by normalized code and enforces the expected role", async () => {
    await expect(
      authenticateDemoAccount(
        seed.accounts,
        " cliente ",
        DEMO_GUEST_CREDENTIALS.password,
        "guest",
      ),
    ).resolves.toMatchObject({ ok: true, account: { role: "guest" } });
    await expect(
      authenticateDemoAccount(
        seed.accounts,
        "CLIENTE",
        DEMO_GUEST_CREDENTIALS.password,
        "admin",
      ),
    ).resolves.toEqual({ ok: false, reason: "wrong_role" });
    await expect(
      authenticateDemoAccount(
        seed.accounts,
        "admin",
        DEMO_ADMIN_CREDENTIALS.password,
        "admin",
      ),
    ).resolves.toMatchObject({ ok: true, account: { role: "admin" } });
  });

  it("invalidates an existing guest session after an admin password reset", async () => {
    const passwordHash = await hashDemoPassword("ReplacementPassword!");
    const before = guestSession();
    const next = replaceAccountPasswordHash(
      seed,
      adminSession(),
      "demo-guest-account",
      passwordHash,
      fixedNow,
    );

    expect(isDemoSessionCurrent(seed.accounts, before)).toBe(true);
    expect(next.accounts[0].credentialVersion).toBe(2);
    expect(isDemoSessionCurrent(next.accounts, before)).toBe(false);
  });
});

describe("guest and admin request operations", () => {
  it("creates an idempotent pending order and permits a pending cancellation", () => {
    const input = {
      serviceDate: "2026-08-01",
      location: "pool" as const,
      requestedTime: "13:00",
      lines: [{ catalogItemId: "product-caprese-sandwich", quantity: 2 }],
      clientRequestId: "submit-order-1",
    };
    const first = createGuestOrder(seed, guestSession(), input, "2026-08-01", fixedNow);
    const repeated = createGuestOrder(
      first.state,
      guestSession(),
      input,
      "2026-08-01",
      fixedNow,
    );

    expect(first.order.status).toBe("pending");
    expect(first.order.lines[0].labelSnapshot.it).toBe("Panino caprese");
    expect(repeated.order.id).toBe(first.order.id);
    expect(repeated.state.orders).toHaveLength(1);
    const cancelled = cancelGuestRequest(
      repeated.state,
      guestSession(),
      "order",
      first.order.id,
      fixedNow,
    );
    expect(cancelled.orders[0].status).toBe("cancelled");
  });

  it("rejects requests in the past and on check-out", () => {
    const input = {
      serviceDate: "2026-07-31",
      location: "room" as const,
      requestedTime: "12:00",
      lines: [{ catalogItemId: "product-salad", quantity: 1 }],
    };

    expect(() =>
      createGuestOrder(seed, guestSession(), input, "2026-08-01", fixedNow),
    ).toThrowError(DemoPortalError);
    expect(() =>
      createGuestOrder(
        seed,
        guestSession(),
        { ...input, serviceDate: seed.stays[0].checkOut },
        "2026-08-01",
        fixedNow,
      ),
    ).toThrowError(/day before check-out/);
  });

  it("refuses stay dates that would strand an existing request", () => {
    const withOrder = createGuestOrder(
      seed,
      guestSession(),
      {
        serviceDate: "2026-08-04",
        location: "room",
        requestedTime: "12:00",
        lines: [{ catalogItemId: "product-salad", quantity: 1 }],
      },
      "2026-08-01",
      fixedNow,
    ).state;

    expect(() =>
      updateAdminStay(
        withOrder,
        adminSession(),
        "demo-stay",
        { checkOut: "2026-08-04" },
        fixedNow,
      ),
    ).toThrowError(/exclude an existing request/);
  });

  it("creates an activity request and lets admin progress valid states", () => {
    const created = createGuestActivityRequest(
      seed,
      guestSession(),
      {
        activityId: "activity-boat-trip",
        requestedDate: "2026-08-02",
        preferredTime: "10:30",
        participants: 2,
      },
      "2026-08-01",
      fixedNow,
    );
    const confirmed = updateAdminRequest(
      created.state,
      adminSession(),
      { kind: "activity", id: created.request.id, status: "confirmed", staffNote: "10:30 al molo" },
      fixedNow,
    );
    const fulfilled = updateAdminRequest(
      confirmed,
      adminSession(),
      { kind: "activity", id: created.request.id, status: "fulfilled" },
      fixedNow,
    );

    expect(confirmed.activityRequests[0].staffNote).toBe("10:30 al molo");
    expect(fulfilled.activityRequests[0].status).toBe("fulfilled");
    expect(() =>
      updateAdminRequest(
        fulfilled,
        adminSession(),
        { kind: "activity", id: created.request.id, status: "pending" },
        fixedNow,
      ),
    ).toThrowError(/Cannot move/);
  });

  it("creates idempotent guide requests and supports guest/admin transitions", () => {
    const input = {
      guideItemId: "guide-le-tre-sorelle",
      requestedDate: "2026-08-02",
      preferredTime: "20:00",
      participants: 2,
      notes: "  Tavolo in terrazza, se possibile.  ",
      clientRequestId: "guide-request-1",
    };
    const created = createGuestGuideRequest(
      seed,
      guestSession(),
      input,
      "2026-08-01",
      fixedNow,
    );
    const repeated = createGuestGuideRequest(
      created.state,
      guestSession(),
      input,
      "2026-08-01",
      fixedNow,
    );
    const confirmed = updateAdminRequest(
      repeated.state,
      adminSession(),
      {
        kind: "guide",
        id: created.request.id,
        status: "confirmed",
        staffNote: "Conferma attesa dal ristorante",
      },
      fixedNow,
    );
    const fulfilled = updateAdminRequest(
      confirmed,
      adminSession(),
      { kind: "guide", id: created.request.id, status: "fulfilled" },
      fixedNow,
    );

    expect(created.request.guideLabelSnapshot.it).toBe("Le Tre Sorelle");
    expect(created.request.notes).toBe("Tavolo in terrazza, se possibile.");
    expect(repeated.request.id).toBe(created.request.id);
    expect(repeated.state.guideRequests).toHaveLength(1);
    expect(confirmed.guideRequests[0].staffNote).toBe(
      "Conferma attesa dal ristorante",
    );
    expect(fulfilled.guideRequests[0].status).toBe("fulfilled");

    const cancellable = createGuestGuideRequest(
      seed,
      guestSession(),
      { ...input, clientRequestId: "guide-request-2" },
      "2026-08-01",
      fixedNow,
    );
    const cancelled = cancelGuestRequest(
      cancellable.state,
      guestSession(),
      "guide",
      cancellable.request.id,
      fixedNow,
    );
    expect(cancelled.guideRequests[0].status).toBe("cancelled");
  });

  it("rejects guide requests for informational-only places", () => {
    const informational = seed.catalog.find(
      (item) => item.kind === "guide" && !item.requestable,
    );
    expect(informational?.kind).toBe("guide");

    expect(() =>
      createGuestGuideRequest(
        seed,
        guestSession(),
        {
          guideItemId: informational?.id ?? "missing",
          requestedDate: "2026-08-02",
          preferredTime: "10:00",
          participants: 2,
        },
        "2026-08-01",
        fixedNow,
      ),
    ).toThrowError(/not available for requests/);
  });

  it("saves guide catalog data without accepting prices or unsafe URLs", () => {
    const input = {
      kind: "guide" as const,
      category: "dining" as const,
      labels: {
        en: "  Family table  ",
        it: "  Tavola di famiglia  ",
        de: "  Familientisch  ",
        ru: "  Семейный стол  ",
      },
      description: {
        en: "A small dining room.",
        it: "Una piccola sala.",
        de: "Ein kleiner Speiseraum.",
        ru: "Небольшой зал.",
      },
      requestable: true,
      verifiedAt: "2026-08-01",
      address: "  Via della Demo 1  ",
      websiteUrl: "https://example.com/table",
      active: true,
    };
    const saved = saveAdminCatalogItem(
      seed,
      adminSession(),
      input,
      fixedNow,
    );

    expect(saved.item).toMatchObject({
      kind: "guide",
      address: "Via della Demo 1",
      requestable: true,
      labels: { it: "Tavola di famiglia" },
    });
    expect("priceCents" in saved.item).toBe(false);

    expect(() =>
      saveAdminCatalogItem(
        seed,
        adminSession(),
        { ...input, websiteUrl: "javascript:alert(1)" },
        fixedNow,
      ),
    ).toThrowError(/Invalid website URL/);
    expect(() =>
      saveAdminCatalogItem(
        seed,
        adminSession(),
        { ...input, priceCents: 1_000 } as unknown as DemoCatalogItemInput,
        fixedNow,
      ),
    ).toThrowError(/cannot have a price/);
  });
});
