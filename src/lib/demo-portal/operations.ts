import { assertValidStayRange, isStayDateOrderable } from "./dates";
import { normaliseLoginCode } from "./security";
import type {
  DemoAccount,
  DemoActivityRequest,
  DemoActivityRequestInput,
  DemoCatalogItem,
  DemoCatalogItemInput,
  DemoCreateStayInput,
  DemoCreatedStay,
  DemoDate,
  DemoGuideRequest,
  DemoGuideRequestInput,
  DemoLocalizedLabel,
  DemoOrder,
  DemoOrderInput,
  DemoPortalState,
  DemoRequestStatus,
  DemoSession,
  DemoStay,
  DemoStayPatch,
  DemoUpdateRequestInput,
} from "./types";
import {
  DEMO_GUIDE_CATEGORIES,
  DEMO_LOCALES,
  DemoPortalError,
} from "./types";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function withUpdatedAt(state: DemoPortalState, timestamp: string): DemoPortalState {
  return { ...state, revision: state.revision + 1, updatedAt: timestamp };
}

function requireRole(
  state: DemoPortalState,
  session: DemoSession | null,
  role: "guest" | "admin",
): DemoAccount {
  const account = session
    ? state.accounts.find((candidate) => candidate.id === session.accountId)
    : undefined;
  if (!account || account.role !== role || session?.role !== role || !account.active) {
    throw new DemoPortalError("unauthorized", "This action is not allowed.");
  }
  return account;
}

function requireGuestStay(
  state: DemoPortalState,
  session: DemoSession | null,
): DemoStay {
  const account = requireRole(state, session, "guest");
  const stay = state.stays.find(
    (candidate) => candidate.id === account.stayId && candidate.accountId === account.id,
  );
  if (!stay) throw new DemoPortalError("not_found", "Stay not found.");
  if (!stay.active) throw new DemoPortalError("inactive_stay", "This stay is inactive.");
  return stay;
}

function assertRequestDate(stay: DemoStay, date: DemoDate, today: DemoDate): void {
  if (!isStayDateOrderable(stay, date, today)) {
    throw new DemoPortalError(
      "date_not_orderable",
      "Requests are available from today until the day before check-out.",
    );
  }
}

function assertTime(value: string): void {
  if (!TIME_PATTERN.test(value)) {
    throw new DemoPortalError("invalid_input", "Use a valid time in HH:mm format.");
  }
}

function assertParticipants(participants: number, stay: DemoStay): void {
  if (
    !Number.isInteger(participants) ||
    participants < 1 ||
    participants > stay.guests
  ) {
    throw new DemoPortalError(
      "invalid_input",
      "Participants must be between 1 and the number of guests.",
    );
  }
}

function assertRequestStatusTransition(
  current: DemoRequestStatus,
  next: DemoRequestStatus,
): void {
  const transitions: Record<DemoRequestStatus, readonly DemoRequestStatus[]> = {
    pending: ["confirmed", "rejected", "cancelled"],
    confirmed: ["fulfilled", "cancelled"],
    rejected: [],
    fulfilled: [],
    cancelled: [],
  };
  if (current !== next && !transitions[current].includes(next)) {
    throw new DemoPortalError(
      "invalid_status_transition",
      `Cannot move a ${current} request to ${next}.`,
    );
  }
}

export function createGuestOrder(
  state: DemoPortalState,
  session: DemoSession | null,
  input: DemoOrderInput,
  today: DemoDate,
  now = new Date(),
): { state: DemoPortalState; order: DemoOrder } {
  const stay = requireGuestStay(state, session);
  assertRequestDate(stay, input.serviceDate, today);
  assertTime(input.requestedTime);
  if (!["room", "pool", "beach"].includes(input.location) || input.lines.length === 0) {
    throw new DemoPortalError("invalid_input", "Choose a location and at least one item.");
  }

  if (input.clientRequestId) {
    const existing = state.orders.find(
      (order) =>
        order.stayId === stay.id && order.clientRequestId === input.clientRequestId,
    );
    if (existing) return { state, order: existing };
  }

  const productIds = new Set<string>();
  const lines = input.lines.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      throw new DemoPortalError("invalid_input", "Quantities must be between 1 and 20.");
    }
    if (productIds.has(line.catalogItemId)) {
      throw new DemoPortalError("invalid_input", "Each product can appear only once.");
    }
    productIds.add(line.catalogItemId);
    const item = state.catalog.find(
      (candidate) => candidate.id === line.catalogItemId,
    );
    if (!item || item.kind !== "product" || !item.active) {
      throw new DemoPortalError("not_found", "Product not available.");
    }
    return {
      id: createId("line"),
      catalogItemId: item.id,
      quantity: line.quantity,
      labelSnapshot: { ...item.labels },
      unitPriceCents: item.priceCents,
    };
  });
  const timestamp = now.toISOString();
  const order: DemoOrder = {
    id: createId("order"),
    stayId: stay.id,
    serviceDate: input.serviceDate,
    location: input.location,
    requestedTime: input.requestedTime,
    notes: input.notes?.trim().slice(0, 1_000) ?? "",
    lines,
    status: "pending",
    staffNote: "",
    clientRequestId: input.clientRequestId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    state: withUpdatedAt({ ...state, orders: [...state.orders, order] }, timestamp),
    order,
  };
}

export function createGuestActivityRequest(
  state: DemoPortalState,
  session: DemoSession | null,
  input: DemoActivityRequestInput,
  today: DemoDate,
  now = new Date(),
): { state: DemoPortalState; request: DemoActivityRequest } {
  const stay = requireGuestStay(state, session);
  assertRequestDate(stay, input.requestedDate, today);
  assertTime(input.preferredTime);
  assertParticipants(input.participants, stay);
  if (input.clientRequestId) {
    const existing = state.activityRequests.find(
      (request) =>
        request.stayId === stay.id && request.clientRequestId === input.clientRequestId,
    );
    if (existing) return { state, request: existing };
  }
  const activity = state.catalog.find(
    (candidate) =>
      candidate.id === input.activityId && candidate.kind === "activity" && candidate.active,
  );
  if (!activity) throw new DemoPortalError("not_found", "Activity not available.");
  const timestamp = now.toISOString();
  const request: DemoActivityRequest = {
    id: createId("activity-request"),
    stayId: stay.id,
    activityId: activity.id,
    activityLabelSnapshot: { ...activity.labels },
    requestedDate: input.requestedDate,
    preferredTime: input.preferredTime,
    participants: input.participants,
    notes: input.notes?.trim().slice(0, 1_000) ?? "",
    status: "pending",
    staffNote: "",
    clientRequestId: input.clientRequestId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    state: withUpdatedAt(
      { ...state, activityRequests: [...state.activityRequests, request] },
      timestamp,
    ),
    request,
  };
}

export function createGuestGuideRequest(
  state: DemoPortalState,
  session: DemoSession | null,
  input: DemoGuideRequestInput,
  today: DemoDate,
  now = new Date(),
): { state: DemoPortalState; request: DemoGuideRequest } {
  const stay = requireGuestStay(state, session);
  assertRequestDate(stay, input.requestedDate, today);
  assertTime(input.preferredTime);
  assertParticipants(input.participants, stay);

  if (input.clientRequestId) {
    const existing = state.guideRequests.find(
      (request) =>
        request.stayId === stay.id &&
        request.clientRequestId === input.clientRequestId,
    );
    if (existing) return { state, request: existing };
  }

  const guideItem = state.catalog.find(
    (candidate) =>
      candidate.id === input.guideItemId &&
      candidate.kind === "guide" &&
      candidate.active &&
      candidate.requestable,
  );
  if (!guideItem) {
    throw new DemoPortalError("not_found", "Guide item not available for requests.");
  }

  const timestamp = now.toISOString();
  const request: DemoGuideRequest = {
    id: createId("guide-request"),
    stayId: stay.id,
    guideItemId: guideItem.id,
    guideLabelSnapshot: { ...guideItem.labels },
    requestedDate: input.requestedDate,
    preferredTime: input.preferredTime,
    participants: input.participants,
    notes: input.notes?.trim().slice(0, 1_000) ?? "",
    status: "pending",
    staffNote: "",
    clientRequestId: input.clientRequestId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    state: withUpdatedAt(
      { ...state, guideRequests: [...state.guideRequests, request] },
      timestamp,
    ),
    request,
  };
}

export function cancelGuestRequest(
  state: DemoPortalState,
  session: DemoSession | null,
  kind: "order" | "activity" | "guide",
  id: string,
  now = new Date(),
): DemoPortalState {
  const stay = requireGuestStay(state, session);
  const timestamp = now.toISOString();
  if (kind === "order") {
    const target = state.orders.find((order) => order.id === id && order.stayId === stay.id);
    if (!target) throw new DemoPortalError("not_found", "Order not found.");
    if (target.status !== "pending") {
      throw new DemoPortalError("invalid_status_transition", "Only pending orders can be cancelled.");
    }
    return withUpdatedAt(
      {
        ...state,
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, status: "cancelled", updatedAt: timestamp } : order,
        ),
      },
      timestamp,
    );
  }

  if (kind === "activity") {
    const target = state.activityRequests.find(
      (request) => request.id === id && request.stayId === stay.id,
    );
    if (!target) throw new DemoPortalError("not_found", "Activity request not found.");
    if (target.status !== "pending") {
      throw new DemoPortalError(
        "invalid_status_transition",
        "Only pending activity requests can be cancelled.",
      );
    }
    return withUpdatedAt(
      {
        ...state,
        activityRequests: state.activityRequests.map((request) =>
          request.id === id
            ? { ...request, status: "cancelled", updatedAt: timestamp }
            : request,
        ),
      },
      timestamp,
    );
  }

  const target = state.guideRequests.find(
    (request) => request.id === id && request.stayId === stay.id,
  );
  if (!target) throw new DemoPortalError("not_found", "Guide request not found.");
  if (target.status !== "pending") {
    throw new DemoPortalError(
      "invalid_status_transition",
      "Only pending guide requests can be cancelled.",
    );
  }
  return withUpdatedAt(
    {
      ...state,
      guideRequests: state.guideRequests.map((request) =>
        request.id === id
          ? { ...request, status: "cancelled", updatedAt: timestamp }
          : request,
      ),
    },
    timestamp,
  );
}

export function createStayWithAccount(
  state: DemoPortalState,
  session: DemoSession | null,
  input: DemoCreateStayInput,
  passwordHash: string,
  loginCode: string,
  now = new Date(),
): Omit<DemoCreatedStay, "credential"> & { state: DemoPortalState } {
  requireRole(state, session, "admin");
  assertValidStayRange(input.checkIn, input.checkOut);
  const surname = input.surname.trim();
  const room = input.room.trim();
  if (!surname || !room || !Number.isInteger(input.guests) || input.guests < 1 || input.guests > 20) {
    throw new DemoPortalError("invalid_input", "Complete the stay details.");
  }
  const normalisedCode = normaliseLoginCode(loginCode);
  if (!normalisedCode || state.accounts.some((account) => account.loginCode === normalisedCode)) {
    throw new DemoPortalError("duplicate_login_code", "This login code already exists.");
  }
  const timestamp = now.toISOString();
  const accountId = createId("guest");
  const stayId = createId("stay");
  const account: DemoAccount = {
    id: accountId,
    loginCode: normalisedCode,
    passwordHash,
    credentialVersion: 1,
    role: "guest",
    active: true,
    stayId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const stay: DemoStay = {
    id: stayId,
    accountId,
    surname,
    guestName: input.guestName?.trim() || `Famiglia ${surname}`,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    room,
    guests: input.guests,
    locale: input.locale,
    active: true,
    autoAnchorToToday: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  return {
    state: withUpdatedAt(
      {
        ...state,
        accounts: [...state.accounts, account],
        stays: [...state.stays, stay],
      },
      timestamp,
    ),
    account,
    stay,
  };
}

export function updateAdminStay(
  state: DemoPortalState,
  session: DemoSession | null,
  stayId: string,
  patch: DemoStayPatch,
  now = new Date(),
): DemoPortalState {
  requireRole(state, session, "admin");
  const current = state.stays.find((stay) => stay.id === stayId);
  if (!current) throw new DemoPortalError("not_found", "Stay not found.");
  const next = { ...current, ...patch };
  assertValidStayRange(next.checkIn, next.checkOut);
  const hasRequestsOutsideRange =
    state.orders.some(
      (order) =>
        order.stayId === stayId &&
        (order.serviceDate < next.checkIn || order.serviceDate >= next.checkOut),
    ) ||
    state.activityRequests.some(
      (request) =>
        request.stayId === stayId &&
        (request.requestedDate < next.checkIn ||
          request.requestedDate >= next.checkOut),
    ) ||
    state.guideRequests.some(
      (request) =>
        request.stayId === stayId &&
        (request.requestedDate < next.checkIn ||
          request.requestedDate >= next.checkOut),
    );
  if (hasRequestsOutsideRange) {
    throw new DemoPortalError(
      "invalid_stay",
      "The new dates would exclude an existing request.",
    );
  }
  if (
    !next.surname.trim() ||
    !next.guestName.trim() ||
    !next.room.trim() ||
    !Number.isInteger(next.guests) ||
    next.guests < 1 ||
    next.guests > 20 ||
    !DEMO_LOCALES.includes(next.locale)
  ) {
    throw new DemoPortalError("invalid_input", "Invalid stay details.");
  }
  const timestamp = now.toISOString();
  return withUpdatedAt(
    {
      ...state,
      stays: state.stays.map((stay) =>
        stay.id === stayId
          ? {
              ...next,
              surname: next.surname.trim(),
              guestName: next.guestName.trim(),
              room: next.room.trim(),
              autoAnchorToToday:
                stay.autoAnchorToToday &&
                patch.checkIn === undefined &&
                patch.checkOut === undefined,
              updatedAt: timestamp,
            }
          : stay,
      ),
    },
    timestamp,
  );
}

export function toggleAdminStay(
  state: DemoPortalState,
  session: DemoSession | null,
  stayId: string,
  active?: boolean,
  now = new Date(),
): DemoPortalState {
  requireRole(state, session, "admin");
  const stay = state.stays.find((candidate) => candidate.id === stayId);
  if (!stay) throw new DemoPortalError("not_found", "Stay not found.");
  const nextActive = active ?? !stay.active;
  const timestamp = now.toISOString();
  return withUpdatedAt(
    {
      ...state,
      stays: state.stays.map((candidate) =>
        candidate.id === stayId
          ? { ...candidate, active: nextActive, updatedAt: timestamp }
          : candidate,
      ),
      accounts: state.accounts.map((account) =>
        account.id === stay.accountId
          ? { ...account, active: nextActive, updatedAt: timestamp }
          : account,
      ),
    },
    timestamp,
  );
}

export function replaceAccountPasswordHash(
  state: DemoPortalState,
  session: DemoSession | null,
  accountId: string,
  passwordHash: string,
  now = new Date(),
): DemoPortalState {
  requireRole(state, session, "admin");
  const account = state.accounts.find(
    (candidate) => candidate.id === accountId && candidate.role === "guest",
  );
  if (!account) throw new DemoPortalError("not_found", "Guest account not found.");
  const timestamp = now.toISOString();
  return withUpdatedAt(
    {
      ...state,
      accounts: state.accounts.map((candidate) =>
        candidate.id === accountId
          ? {
              ...candidate,
              passwordHash,
              credentialVersion: candidate.credentialVersion + 1,
              updatedAt: timestamp,
            }
          : candidate,
      ),
    },
    timestamp,
  );
}

function validateCatalogInput(input: DemoCatalogItemInput): void {
  normaliseLocalizedLabel(input.labels, 120, "labels");
  normaliseOptionalLocalizedLabel(input.description, 600, "description");
  if (
    input.sortOrder !== undefined &&
    (!Number.isInteger(input.sortOrder) || input.sortOrder < 0)
  ) {
    throw new DemoPortalError("invalid_input", "Invalid catalog order.");
  }

  if (input.kind === "product") {
    if (
      !["food", "classic-drink", "wine", "champagne", "raw-fish"].includes(
        input.category,
      )
    ) {
      throw new DemoPortalError("invalid_input", "Category and item type do not match.");
    }
    assertOptionalPrice(input.priceCents);
    return;
  }

  if (input.kind === "activity") {
    if (
      !["fishing", "boat-trip", "lemon-grove", "other"].includes(input.category)
    ) {
      throw new DemoPortalError("invalid_input", "Category and item type do not match.");
    }
    assertOptionalPrice(input.priceCents);
    return;
  }

  if (!DEMO_GUIDE_CATEGORIES.includes(input.category)) {
    throw new DemoPortalError("invalid_input", "Category and item type do not match.");
  }
  if (
    "priceCents" in input &&
    (input as DemoCatalogItemInput & { priceCents?: unknown }).priceCents !== undefined
  ) {
    throw new DemoPortalError("invalid_input", "Guide items cannot have a price.");
  }
  if (typeof input.requestable !== "boolean") {
    throw new DemoPortalError("invalid_input", "Invalid guide request setting.");
  }
  const verifiedAt = input.verifiedAt?.trim();
  if (!verifiedAt || Number.isNaN(Date.parse(verifiedAt))) {
    throw new DemoPortalError("invalid_input", "Use a valid verification date.");
  }
  normaliseOptionalText(input.address, 180, "address");
  normaliseOptionalText(input.phone, 80, "phone");
  normaliseOptionalHttpUrl(input.websiteUrl, "website URL");
  normaliseOptionalHttpUrl(input.mapsUrl, "maps URL");
  normaliseOptionalLocalizedLabel(input.bookingNote, 300, "booking note");
}

function assertOptionalPrice(priceCents: number | undefined): void {
  if (
    priceCents !== undefined &&
    (!Number.isInteger(priceCents) || priceCents < 0)
  ) {
    throw new DemoPortalError("invalid_input", "Invalid catalog price.");
  }
}

function normaliseLocalizedLabel(
  value: DemoLocalizedLabel,
  maxLength: number,
  field: string,
): DemoLocalizedLabel {
  if (!value || typeof value !== "object") {
    throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
  }
  const entries = DEMO_LOCALES.map((locale) => {
    const candidate = (value as Partial<DemoLocalizedLabel>)[locale];
    if (typeof candidate !== "string") {
      throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
    }
    const trimmed = candidate.trim();
    if (!trimmed || trimmed.length > maxLength) {
      throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
    }
    return [locale, trimmed] as const;
  });
  return Object.fromEntries(entries) as DemoLocalizedLabel;
}

function normaliseOptionalLocalizedLabel(
  value: DemoLocalizedLabel | undefined,
  maxLength: number,
  field: string,
): DemoLocalizedLabel | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") {
    throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
  }
  const rawValues = DEMO_LOCALES.map(
    (locale) => (value as Partial<DemoLocalizedLabel>)[locale],
  );
  if (rawValues.some((candidate) => typeof candidate !== "string")) {
    throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
  }
  if (rawValues.every((candidate) => !(candidate as string).trim())) return undefined;
  return normaliseLocalizedLabel(value, maxLength, field);
}

function normaliseOptionalText(
  value: string | undefined,
  maxLength: number,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) {
    throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
  }
  return trimmed;
}

function normaliseOptionalHttpUrl(
  value: string | undefined,
  field: string,
): string | undefined {
  const trimmed = normaliseOptionalText(value, 2_048, field);
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new DemoPortalError("invalid_input", `Invalid ${field}.`);
  }
  return trimmed;
}

export function saveAdminCatalogItem(
  state: DemoPortalState,
  session: DemoSession | null,
  input: DemoCatalogItemInput,
  now = new Date(),
): { state: DemoPortalState; item: DemoCatalogItem } {
  requireRole(state, session, "admin");
  validateCatalogInput(input);
  const timestamp = now.toISOString();
  const existing = input.id
    ? state.catalog.find((candidate) => candidate.id === input.id)
    : undefined;
  if (input.id && !existing) throw new DemoPortalError("not_found", "Catalog item not found.");
  if (existing && existing.kind !== input.kind) {
    throw new DemoPortalError("invalid_input", "Catalog item type cannot be changed.");
  }
  const slug = (input.slug || existing?.slug || input.labels.en)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new DemoPortalError("invalid_input", "Invalid catalog slug.");
  const common = {
    id: existing?.id ?? createId(input.kind),
    slug,
    labels: normaliseLocalizedLabel(input.labels, 120, "labels"),
    description: normaliseOptionalLocalizedLabel(
      input.description,
      600,
      "description",
    ),
    active: input.active ?? existing?.active ?? true,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? state.catalog.length * 10 + 10,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  let item: DemoCatalogItem;
  if (input.kind === "product") {
    item = {
      ...common,
      kind: "product",
      category: input.category,
      priceCents: input.priceCents,
    };
  } else if (input.kind === "activity") {
    item = {
      ...common,
      kind: "activity",
      category: input.category,
      priceCents: input.priceCents,
    };
  } else {
    item = {
      ...common,
      kind: "guide",
      category: input.category,
      address: normaliseOptionalText(input.address, 180, "address"),
      phone: normaliseOptionalText(input.phone, 80, "phone"),
      websiteUrl: normaliseOptionalHttpUrl(input.websiteUrl, "website URL"),
      mapsUrl: normaliseOptionalHttpUrl(input.mapsUrl, "maps URL"),
      bookingNote: normaliseOptionalLocalizedLabel(
        input.bookingNote,
        300,
        "booking note",
      ),
      requestable: input.requestable,
      verifiedAt: input.verifiedAt.trim(),
    };
  }
  const catalog = existing
    ? state.catalog.map((candidate) => (candidate.id === existing.id ? item : candidate))
    : [...state.catalog, item];
  return { state: withUpdatedAt({ ...state, catalog }, timestamp), item };
}

export function toggleAdminCatalogItem(
  state: DemoPortalState,
  session: DemoSession | null,
  itemId: string,
  active?: boolean,
  now = new Date(),
): DemoPortalState {
  requireRole(state, session, "admin");
  const item = state.catalog.find((candidate) => candidate.id === itemId);
  if (!item) throw new DemoPortalError("not_found", "Catalog item not found.");
  const timestamp = now.toISOString();
  return withUpdatedAt(
    {
      ...state,
      catalog: state.catalog.map((candidate) =>
        candidate.id === itemId
          ? { ...candidate, active: active ?? !candidate.active, updatedAt: timestamp }
          : candidate,
      ),
    },
    timestamp,
  );
}

export function updateAdminRequest(
  state: DemoPortalState,
  session: DemoSession | null,
  input: DemoUpdateRequestInput,
  now = new Date(),
): DemoPortalState {
  requireRole(state, session, "admin");
  const timestamp = now.toISOString();
  const staffNote = input.staffNote?.trim().slice(0, 1_000) ?? "";
  if (input.kind === "order") {
    const request = state.orders.find((order) => order.id === input.id);
    if (!request) throw new DemoPortalError("not_found", "Order not found.");
    assertRequestStatusTransition(request.status, input.status);
    return withUpdatedAt(
      {
        ...state,
        orders: state.orders.map((order) =>
          order.id === input.id
            ? { ...order, status: input.status, staffNote, updatedAt: timestamp }
            : order,
        ),
      },
      timestamp,
    );
  }
  if (input.kind === "activity") {
    const request = state.activityRequests.find((candidate) => candidate.id === input.id);
    if (!request) throw new DemoPortalError("not_found", "Activity request not found.");
    assertRequestStatusTransition(request.status, input.status);
    return withUpdatedAt(
      {
        ...state,
        activityRequests: state.activityRequests.map((candidate) =>
          candidate.id === input.id
            ? { ...candidate, status: input.status, staffNote, updatedAt: timestamp }
            : candidate,
        ),
      },
      timestamp,
    );
  }

  const request = state.guideRequests.find((candidate) => candidate.id === input.id);
  if (!request) throw new DemoPortalError("not_found", "Guide request not found.");
  assertRequestStatusTransition(request.status, input.status);
  return withUpdatedAt(
    {
      ...state,
      guideRequests: state.guideRequests.map((candidate) =>
        candidate.id === input.id
          ? { ...candidate, status: input.status, staffNote, updatedAt: timestamp }
          : candidate,
      ),
    },
    timestamp,
  );
}

export function updateGuestLocale(
  state: DemoPortalState,
  session: DemoSession | null,
  locale: DemoStay["locale"],
  now = new Date(),
): DemoPortalState {
  const stay = requireGuestStay(state, session);
  if (!DEMO_LOCALES.includes(locale)) {
    throw new DemoPortalError("invalid_input", "Unsupported language.");
  }
  const timestamp = now.toISOString();
  return withUpdatedAt(
    {
      ...state,
      stays: state.stays.map((candidate) =>
        candidate.id === stay.id ? { ...candidate, locale, updatedAt: timestamp } : candidate,
      ),
    },
    timestamp,
  );
}

export function generateUniqueLoginCode(
  state: DemoPortalState,
  surname: string,
): string {
  const base = surname
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 14) || "OSPITE";
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const random = new Uint16Array(1);
    globalThis.crypto.getRandomValues(random);
    const suffix = String(10 + (random[0] % 90));
    const candidate = `${base}-${suffix}`;
    if (!state.accounts.some((account) => account.loginCode === candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}
