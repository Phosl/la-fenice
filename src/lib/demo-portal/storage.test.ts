// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createDemoPortalSeed } from "./seed";
import {
  DEMO_SESSION_STORAGE_KEY,
  loadDemoSession,
  saveDemoSession,
  saveDemoState,
} from "./storage";
import type { DemoPortalState, DemoSession } from "./types";

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
        loginCode: "ROSSI-27",
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
      loginCode: "ROSSI-27",
      role: "guest",
      createdAt: "2026-08-01T10:00:00.000Z",
    };
    window.sessionStorage.setItem(
      DEMO_SESSION_STORAGE_KEY,
      JSON.stringify(legacySession),
    );

    expect(loadDemoSession()).toBeNull();
  });
});
