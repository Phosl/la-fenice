import type { DemoPortalState, DemoSession } from "./types";
import { DEMO_PORTAL_VERSION } from "./types";

export const DEMO_STATE_STORAGE_KEY = "la-fenice:demo-portal:v3";
export const DEMO_SESSION_STORAGE_KEY = "la-fenice:demo-session:v3";
const DEMO_CHANGE_EVENT = "la-fenice:demo-portal-change";

export function isDemoPortalState(value: unknown): value is DemoPortalState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DemoPortalState>;
  return (
    candidate.version === DEMO_PORTAL_VERSION &&
    Number.isInteger(candidate.revision) &&
    Array.isArray(candidate.accounts) &&
    candidate.accounts.every(
      (account) =>
        account &&
        typeof account === "object" &&
        Number.isInteger((account as { credentialVersion?: unknown }).credentialVersion),
    ) &&
    Array.isArray(candidate.stays) &&
    candidate.stays.every(
      (stay) =>
        stay &&
        typeof stay === "object" &&
        typeof (stay as { autoAnchorToToday?: unknown }).autoAnchorToToday ===
          "boolean",
    ) &&
    Array.isArray(candidate.catalog) &&
    Array.isArray(candidate.orders) &&
    Array.isArray(candidate.activityRequests)
  );
}

export function loadDemoState(): DemoPortalState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDemoPortalState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type DemoStateSaveResult =
  | { ok: true }
  | { ok: false; reason: "storage_unavailable" }
  | { ok: false; reason: "concurrent_update"; current: DemoPortalState | null };

export function saveDemoState(
  state: DemoPortalState,
  expectedRevision?: number,
): DemoStateSaveResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "storage_unavailable" };
  }
  try {
    if (expectedRevision !== undefined) {
      const raw = window.localStorage.getItem(DEMO_STATE_STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      const current = isDemoPortalState(parsed) ? parsed : null;
      if (current && current.revision !== expectedRevision) {
        return { ok: false, reason: "concurrent_update", current };
      }
    }
    window.localStorage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(state));
    try {
      window.dispatchEvent(new CustomEvent(DEMO_CHANGE_EVENT, { detail: state }));
    } catch {
      // Persistence succeeded; a blocked custom event must not break the demo.
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_unavailable" };
  }
}

export function loadDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (
      typeof parsed.accountId !== "string" ||
      typeof parsed.loginCode !== "string" ||
      (parsed.role !== "guest" && parsed.role !== "admin") ||
      !Number.isInteger(parsed.credentialVersion) ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }
    return parsed as DemoSession;
  } catch {
    return null;
  }
}

export function saveDemoSession(session: DemoSession | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (session) {
      window.sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

export function subscribeToDemoState(listener: (state: DemoPortalState) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== DEMO_STATE_STORAGE_KEY || !event.newValue) return;
    try {
      const parsed: unknown = JSON.parse(event.newValue);
      if (isDemoPortalState(parsed)) listener(parsed);
    } catch {
      // Ignore malformed data from another tab; reset remains available locally.
    }
  };
  const onCustomEvent = (event: Event) => {
    const state = (event as CustomEvent<unknown>).detail;
    if (isDemoPortalState(state)) listener(state);
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(DEMO_CHANGE_EVENT, onCustomEvent);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DEMO_CHANGE_EVENT, onCustomEvent);
  };
}
