import { createGuideSeedCatalog } from "./guide-seed";
import type {
  DemoAccount,
  DemoActivityCatalogItem,
  DemoActivityRequest,
  DemoCatalogItem,
  DemoGuideCatalogItem,
  DemoGuideRequest,
  DemoLocalizedLabel,
  DemoOrder,
  DemoOrderLine,
  DemoPortalState,
  DemoProductCatalogItem,
  DemoRequestStatus,
  DemoSession,
  DemoStay,
} from "./types";
import {
  DEMO_GUIDE_CATEGORIES,
  DEMO_LOCALES,
  DEMO_PORTAL_VERSION,
} from "./types";

export const DEMO_STATE_STORAGE_KEY = "la-fenice:demo-portal:v4";
export const DEMO_LEGACY_STATE_STORAGE_KEY = "la-fenice:demo-portal:v3";
export const DEMO_SESSION_STORAGE_KEY = "la-fenice:demo-session:v4";
export const DEMO_LEGACY_SESSION_STORAGE_KEY = "la-fenice:demo-session:v3";
const DEMO_CHANGE_EVENT = "la-fenice:demo-portal-change";

type DemoLegacyCatalogItem =
  | DemoProductCatalogItem
  | DemoActivityCatalogItem;

export interface DemoPortalStateV3 {
  version: 3;
  revision: number;
  accounts: DemoAccount[];
  stays: DemoStay[];
  catalog: DemoLegacyCatalogItem[];
  orders: DemoOrder[];
  activityRequests: DemoActivityRequest[];
  updatedAt: string;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isIntegerAtLeast(value: unknown, minimum: number): value is number {
  return Number.isInteger(value) && (value as number) >= minimum;
}

function isLocalizedLabel(value: unknown): value is DemoLocalizedLabel {
  return (
    isRecord(value) &&
    DEMO_LOCALES.every((locale) => typeof value[locale] === "string")
  );
}

function isOptionalLocalizedLabel(
  value: unknown,
): value is DemoLocalizedLabel | undefined {
  return value === undefined || isLocalizedLabel(value);
}

function isRequestStatus(value: unknown): value is DemoRequestStatus {
  return ["pending", "confirmed", "rejected", "fulfilled", "cancelled"].includes(
    value as DemoRequestStatus,
  );
}

function isAccount(value: unknown): value is DemoAccount {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.loginCode) &&
    isString(value.passwordHash) &&
    isIntegerAtLeast(value.credentialVersion, 1) &&
    (value.role === "guest" || value.role === "admin") &&
    typeof value.active === "boolean" &&
    isOptionalString(value.stayId) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isStay(value: unknown): value is DemoStay {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.accountId) &&
    isString(value.surname) &&
    isString(value.guestName) &&
    isString(value.checkIn) &&
    isString(value.checkOut) &&
    isString(value.room) &&
    isIntegerAtLeast(value.guests, 1) &&
    DEMO_LOCALES.includes(value.locale as DemoStay["locale"]) &&
    typeof value.active === "boolean" &&
    typeof value.autoAnchorToToday === "boolean" &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function hasCatalogBase(value: UnknownRecord): boolean {
  return (
    isString(value.id) &&
    isString(value.slug) &&
    isLocalizedLabel(value.labels) &&
    isOptionalLocalizedLabel(value.description) &&
    typeof value.active === "boolean" &&
    isIntegerAtLeast(value.sortOrder, 0) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function hasOptionalPrice(value: UnknownRecord): boolean {
  return value.priceCents === undefined || isIntegerAtLeast(value.priceCents, 0);
}

function isProductCatalogItem(value: unknown): value is DemoProductCatalogItem {
  if (!isRecord(value) || !hasCatalogBase(value) || value.kind !== "product") {
    return false;
  }
  return (
    ["food", "classic-drink", "wine", "champagne", "raw-fish"].includes(
      value.category as DemoProductCatalogItem["category"],
    ) && hasOptionalPrice(value)
  );
}

function isActivityCatalogItem(value: unknown): value is DemoActivityCatalogItem {
  if (!isRecord(value) || !hasCatalogBase(value) || value.kind !== "activity") {
    return false;
  }
  return (
    ["fishing", "boat-trip", "lemon-grove", "other"].includes(
      value.category as DemoActivityCatalogItem["category"],
    ) && hasOptionalPrice(value)
  );
}

function isHttpUrl(value: unknown): boolean {
  if (!isString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isOptionalHttpUrl(value: unknown): boolean {
  return value === undefined || isHttpUrl(value);
}

function isGuideCatalogItem(value: unknown): value is DemoGuideCatalogItem {
  if (!isRecord(value) || !hasCatalogBase(value) || value.kind !== "guide") {
    return false;
  }
  return (
    DEMO_GUIDE_CATEGORIES.includes(
      value.category as DemoGuideCatalogItem["category"],
    ) &&
    value.priceCents === undefined &&
    isOptionalString(value.address) &&
    isOptionalString(value.phone) &&
    isOptionalHttpUrl(value.websiteUrl) &&
    isOptionalHttpUrl(value.mapsUrl) &&
    isOptionalLocalizedLabel(value.bookingNote) &&
    typeof value.requestable === "boolean" &&
    isString(value.verifiedAt) &&
    value.verifiedAt.length > 0 &&
    !Number.isNaN(Date.parse(value.verifiedAt))
  );
}

function isCatalogItem(value: unknown): value is DemoCatalogItem {
  return (
    isProductCatalogItem(value) ||
    isActivityCatalogItem(value) ||
    isGuideCatalogItem(value)
  );
}

function isOrderLine(value: unknown): value is DemoOrderLine {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.catalogItemId) &&
    isIntegerAtLeast(value.quantity, 1) &&
    isLocalizedLabel(value.labelSnapshot) &&
    hasOptionalPrice(value)
  );
}

function isOrder(value: unknown): value is DemoOrder {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.stayId) &&
    isString(value.serviceDate) &&
    ["room", "pool", "beach"].includes(value.location as DemoOrder["location"]) &&
    isString(value.requestedTime) &&
    isString(value.notes) &&
    Array.isArray(value.lines) &&
    value.lines.every(isOrderLine) &&
    isRequestStatus(value.status) &&
    isString(value.staffNote) &&
    isOptionalString(value.clientRequestId) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function hasRequestBase(value: UnknownRecord): boolean {
  return (
    isString(value.id) &&
    isString(value.stayId) &&
    isString(value.requestedDate) &&
    isString(value.preferredTime) &&
    isIntegerAtLeast(value.participants, 1) &&
    isString(value.notes) &&
    isRequestStatus(value.status) &&
    isString(value.staffNote) &&
    isOptionalString(value.clientRequestId) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isActivityRequest(value: unknown): value is DemoActivityRequest {
  if (!isRecord(value) || !hasRequestBase(value)) return false;
  return isString(value.activityId) && isLocalizedLabel(value.activityLabelSnapshot);
}

function isGuideRequest(value: unknown): value is DemoGuideRequest {
  if (!isRecord(value) || !hasRequestBase(value)) return false;
  return isString(value.guideItemId) && isLocalizedLabel(value.guideLabelSnapshot);
}

function isSession(value: unknown): value is DemoSession {
  if (!isRecord(value)) return false;
  return (
    isString(value.accountId) &&
    isString(value.loginCode) &&
    (value.role === "guest" || value.role === "admin") &&
    isIntegerAtLeast(value.credentialVersion, 1) &&
    isString(value.createdAt)
  );
}

export function isDemoPortalState(value: unknown): value is DemoPortalState {
  if (!isRecord(value)) return false;
  return (
    value.version === DEMO_PORTAL_VERSION &&
    isIntegerAtLeast(value.revision, 0) &&
    Array.isArray(value.accounts) &&
    value.accounts.every(isAccount) &&
    Array.isArray(value.stays) &&
    value.stays.every(isStay) &&
    Array.isArray(value.catalog) &&
    value.catalog.every(isCatalogItem) &&
    Array.isArray(value.orders) &&
    value.orders.every(isOrder) &&
    Array.isArray(value.activityRequests) &&
    value.activityRequests.every(isActivityRequest) &&
    Array.isArray(value.guideRequests) &&
    value.guideRequests.every(isGuideRequest) &&
    isString(value.updatedAt)
  );
}

export function isDemoPortalStateV3(value: unknown): value is DemoPortalStateV3 {
  if (!isRecord(value)) return false;
  return (
    value.version === 3 &&
    isIntegerAtLeast(value.revision, 0) &&
    Array.isArray(value.accounts) &&
    value.accounts.every(isAccount) &&
    Array.isArray(value.stays) &&
    value.stays.every(isStay) &&
    Array.isArray(value.catalog) &&
    value.catalog.every(
      (item) => isProductCatalogItem(item) || isActivityCatalogItem(item),
    ) &&
    Array.isArray(value.orders) &&
    value.orders.every(isOrder) &&
    Array.isArray(value.activityRequests) &&
    value.activityRequests.every(isActivityRequest) &&
    isString(value.updatedAt)
  );
}

export function migrateDemoPortalStateV3(
  legacy: DemoPortalStateV3,
  now = new Date(),
): DemoPortalState {
  const timestamp = now.toISOString();
  const existingIds = new Set(legacy.catalog.map((item) => item.id));
  const guideCatalog = createGuideSeedCatalog(timestamp).filter(
    (item) => !existingIds.has(item.id),
  );
  return {
    ...legacy,
    version: DEMO_PORTAL_VERSION,
    revision: legacy.revision + 1,
    catalog: [...legacy.catalog, ...guideCatalog],
    guideRequests: [],
    updatedAt: timestamp,
  };
}

function parseStoredValue(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadDemoState(): DemoPortalState | null {
  if (typeof window === "undefined") return null;
  try {
    const current = parseStoredValue(window.localStorage, DEMO_STATE_STORAGE_KEY);
    if (isDemoPortalState(current)) return current;

    const legacy = parseStoredValue(
      window.localStorage,
      DEMO_LEGACY_STATE_STORAGE_KEY,
    );
    if (!isDemoPortalStateV3(legacy)) return null;
    const migrated = migrateDemoPortalStateV3(legacy);
    saveDemoState(migrated);
    return migrated;
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
      const parsed = parseStoredValue(window.localStorage, DEMO_STATE_STORAGE_KEY);
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
    const current = parseStoredValue(window.sessionStorage, DEMO_SESSION_STORAGE_KEY);
    if (isSession(current)) return current;

    const legacy = parseStoredValue(
      window.sessionStorage,
      DEMO_LEGACY_SESSION_STORAGE_KEY,
    );
    if (!isSession(legacy)) return null;
    saveDemoSession(legacy);
    return legacy;
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
      window.sessionStorage.removeItem(DEMO_LEGACY_SESSION_STORAGE_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

export function subscribeToDemoState(
  listener: (state: DemoPortalState) => void,
): () => void {
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
