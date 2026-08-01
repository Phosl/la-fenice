// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createDemoPortalSeed } from "./seed";
import {
  DEMO_LEGACY_SESSION_STORAGE_KEY,
  DEMO_LEGACY_STATE_STORAGE_KEY,
  DEMO_SESSION_STORAGE_KEY,
  DEMO_STATE_STORAGE_KEY,
  isDemoPortalState,
  loadDemoSession,
  loadDemoState,
  saveDemoSession,
  saveDemoState,
  type DemoPortalStateV3,
} from "./storage";
import type {
  DemoPortalState,
  DemoSession,
} from "./types";

let seed: DemoPortalState;
let localStorage: MemoryStorage;
let sessionStorage: MemoryStorage;

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

beforeAll(async () => {
  seed = await createDemoPortalSeed(new Date("2026-08-01T10:00:00.000Z"));
});

beforeEach(() => {
  localStorage = new MemoryStorage();
  sessionStorage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
      dispatchEvent: () => true,
    },
  });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("resilient demo browser storage", () => {
  it("keeps mutations non-throwing when browser storage rejects writes", () => {
    localStorage.setItem = () => {
      throw new Error("Quota exceeded");
    };
    sessionStorage.setItem = () => {
      throw new Error("Storage disabled");
    };

    expect(saveDemoState(seed)).toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
    expect(
      saveDemoSession({
        accountId: "demo-guest-account",
        loginCode: "CLIENTE",
        role: "guest",
        credentialVersion: 1,
        createdAt: "2026-08-01T10:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("detects a stale revision before overwriting another tab", () => {
    expect(saveDemoState(seed)).toEqual({ ok: true });
    const revisionTwo = { ...seed, revision: 2 };
    expect(saveDemoState(revisionTwo, 1)).toEqual({ ok: true });
    const result = saveDemoState({ ...seed, revision: 2 }, 1);

    expect(result).toMatchObject({
      ok: false,
      reason: "concurrent_update",
      current: { revision: 2 },
    });
  });

  it("drops legacy sessions without a credential version", () => {
    const legacySession: Omit<DemoSession, "credentialVersion"> = {
      accountId: "demo-guest-account",
      loginCode: "CLIENTE",
      role: "guest",
      createdAt: "2026-08-01T10:00:00.000Z",
    };
    window.sessionStorage.setItem(
      DEMO_SESSION_STORAGE_KEY,
      JSON.stringify(legacySession),
    );

    expect(loadDemoSession()).toBeNull();
  });

  it("migrates v3 state once while preserving existing data", () => {
    const v3: DemoPortalStateV3 = {
      version: 3,
      revision: 7,
      accounts: structuredClone(seed.accounts),
      stays: structuredClone(seed.stays),
      catalog: structuredClone(
        seed.catalog.filter(
          (item) => item.kind === "product" || item.kind === "activity",
        ),
      ),
      orders: structuredClone(seed.orders),
      activityRequests: structuredClone(seed.activityRequests),
      updatedAt: "2026-07-31T10:00:00.000Z",
    };
    v3.catalog[0].labels.it = "Panino conservato";
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, "{malformed");
    localStorage.setItem(DEMO_LEGACY_STATE_STORAGE_KEY, JSON.stringify(v3));

    const migrated = loadDemoState();

    expect(migrated).toMatchObject({ version: 4, revision: 8 });
    expect(migrated?.catalog[0].labels.it).toBe("Panino conservato");
    expect(migrated?.catalog.filter((item) => item.kind === "guide")).toHaveLength(24);
    expect(migrated?.guideRequests).toEqual([]);
    expect(isDemoPortalState(migrated)).toBe(true);
    expect(JSON.parse(localStorage.getItem(DEMO_STATE_STORAGE_KEY) ?? "null"))
      .toMatchObject({ version: 4, revision: 8 });

    expect(loadDemoState()).toEqual(migrated);
  });

  it("migrates valid v3 sessions to the current key", () => {
    const legacySession: DemoSession = {
      accountId: "demo-guest-account",
      loginCode: "CLIENTE",
      role: "guest",
      credentialVersion: 1,
      createdAt: "2026-08-01T10:00:00.000Z",
    };
    sessionStorage.setItem(
      DEMO_LEGACY_SESSION_STORAGE_KEY,
      JSON.stringify(legacySession),
    );

    expect(loadDemoSession()).toEqual(legacySession);
    expect(
      JSON.parse(sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY) ?? "null"),
    ).toEqual(legacySession);

    expect(saveDemoSession(null)).toBe(true);
    expect(sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(DEMO_LEGACY_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("rejects malformed v4 guide data", () => {
    const invalid = {
      ...structuredClone(seed),
      catalog: seed.catalog.map((item) =>
        item.kind === "guide" ? { ...item, priceCents: 50 } : item,
      ),
    };

    expect(isDemoPortalState(invalid)).toBe(false);
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(invalid));
    expect(loadDemoState()).toBeNull();
  });
});
