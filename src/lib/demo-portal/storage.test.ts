// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoPortalSeed } from "./seed";
import { createGuestOrder } from "./operations";
import {
  DEMO_LEGACY_SESSION_STORAGE_KEY,
  DEMO_LEGACY_STATE_STORAGE_KEY,
  DEMO_SESSION_STORAGE_KEY,
  DEMO_STATE_STORAGE_KEY,
  addMissingDiningCatalog,
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
const diningIds = ["product-daily-lunch", "product-pizza-fenice"];

function beforeDining(): DemoPortalState {
  const state = structuredClone(seed);
  state.catalog = state.catalog.filter((item) => !diningIds.includes(item.id));
  return state;
}

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
        beforeDining().catalog.filter(
          (item) => item.kind === "product" || item.kind === "activity",
        ),
      ),
      orders: structuredClone(seed.orders),
      activityRequests: structuredClone(seed.activityRequests),
      updatedAt: "2026-07-31T10:00:00.000Z",
    };
    v3.catalog[0].labels.it = "Panino conservato";
    localStorage.setItem(DEMO_LEGACY_STATE_STORAGE_KEY, JSON.stringify(v3));

    const migrated = loadDemoState();

    expect(migrated).toMatchObject({ version: 4, revision: 8 });
    expect(migrated?.catalog[0].labels.it).toBe("Panino conservato");
    expect(migrated?.catalog.filter((item) => item.kind === "guide")).toHaveLength(24);
    expect(migrated?.catalog.filter((item) => diningIds.includes(item.id))).toHaveLength(2);
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
    expect(() => loadDemoState()).toThrow(/unreadable/);
    expect(localStorage.getItem(DEMO_STATE_STORAGE_KEY)).toBe(JSON.stringify(invalid));
  });

  it("adds only missing dining items and preserves every saved record", () => {
    const original = beforeDining();
    original.catalog[0].labels.it = "Nome scelto dallo staff";
    original.catalog[0].active = false;
    if (original.catalog[0].kind === "product") original.catalog[0].priceCents = 1750;
    original.accounts[0].credentialVersion = 4;
    original.accounts[0].passwordHash = "preserve-this-hash";
    original.stays[0].autoAnchorToToday = false;
    const stored = createGuestOrder(original, {
      accountId: "demo-guest-account", loginCode: "CLIENTE", role: "guest",
      credentialVersion: 4, createdAt: original.updatedAt,
    }, {
      serviceDate: "2026-08-01", location: "room", requestedTime: "13:00",
      lines: [{ catalogItemId: "product-caprese", quantity: 2 }],
    }, "2026-08-01").state;
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(stored));
    const write = vi.spyOn(localStorage, "setItem");

    const updated = loadDemoState()!;

    expect(updated.catalog.slice(0, stored.catalog.length)).toEqual(stored.catalog);
    expect(updated.catalog.slice(stored.catalog.length).map((item) => item.id)).toEqual(diningIds);
    expect({ ...updated, catalog: stored.catalog, revision: stored.revision, updatedAt: stored.updatedAt }).toEqual(stored);
    expect(updated.revision).toBe(stored.revision + 1);
    expect(loadDemoState()).toEqual(updated);
    expect(write).toHaveBeenCalledTimes(1);

    updated.catalog.find((item) => item.id === diningIds[0])!.active = false;
    updated.catalog.find((item) => item.id === diningIds[1])!.labels.it = "Pizza personalizzata";
    saveDemoState(updated);
    const reopened = loadDemoState()!;
    expect(reopened).toEqual(updated);
    expect(addMissingDiningCatalog(reopened)).toBe(reopened);
  });

  it("preserves an existing item using a dining slug", () => {
    const state = beforeDining();
    state.catalog[0].slug = "daily-lunch";
    const updated = addMissingDiningCatalog(state);
    expect(updated.catalog[0]).toEqual(state.catalog[0]);
    expect(updated.catalog.some((item) => item.id === "product-daily-lunch")).toBe(false);
    expect(updated.catalog.some((item) => item.id === "product-pizza-fenice")).toBe(true);
  });

  it("retains the previous state when the dining update cannot be persisted", () => {
    const old = beforeDining();
    const raw = JSON.stringify(old);
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, raw);
    localStorage.setItem = () => { throw new Error("Quota exceeded"); };
    expect(loadDemoState()).toEqual(old);
    expect(localStorage.getItem(DEMO_STATE_STORAGE_KEY)).toBe(raw);
  });

  it("never replaces malformed current data with a seed or an older backup", () => {
    const corrupt = "{malformed";
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, corrupt);
    localStorage.setItem(DEMO_LEGACY_STATE_STORAGE_KEY, JSON.stringify({
      ...beforeDining(), version: 3,
      catalog: beforeDining().catalog.filter((item) => item.kind !== "guide"),
    }));
    expect(() => loadDemoState()).toThrow(/unreadable/);
    expect(saveDemoState(seed)).toEqual({ ok: false, reason: "invalid_storage" });
    expect(localStorage.getItem(DEMO_STATE_STORAGE_KEY)).toBe(corrupt);
  });

  it("stops if stored data becomes invalid between loading and saving the update", () => {
    localStorage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(beforeDining()));
    const read = localStorage.getItem.bind(localStorage);
    let reads = 0;
    vi.spyOn(localStorage, "getItem").mockImplementation((key) => {
      if (key === DEMO_STATE_STORAGE_KEY && ++reads === 3) {
        localStorage.setItem(key, "{changed-malformed");
      }
      return read(key);
    });
    expect(() => loadDemoState()).toThrow(/unreadable/);
    expect(read(DEMO_STATE_STORAGE_KEY)).toBe("{changed-malformed");
  });
});
