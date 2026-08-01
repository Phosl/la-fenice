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
  DemoOrder,
  DemoOrderInput,
  DemoPortalState,
  DemoRequestStatus,
  DemoSession,
  DemoStay,
  DemoStayPatch,
  DemoUpdateRequestInput,
} from "./types";
import { DEMO_LOCALES, DemoPortalError } from "./types";

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
      (candidate) =>
        candidate.id === line.catalogItemId && candidate.kind === "product" && candidate.active,
    );
    if (!item) throw new DemoPortalError("not_found", "Product not available.");
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
  if (
    !Number.isInteger(input.participants) ||
    input.participants < 1 ||
    input.participants > stay.guests
  ) {
    throw new DemoPortalError(
      "invalid_input",
      "Participants must be between 1 and the number of guests.",
    );
  }
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

export function cancelGuestRequest(
  state: DemoPortalState,
  session: DemoSession | null,
  kind: "order" | "activity",
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
  if (
    Object.values(input.labels).some((label) => !label.trim()) ||
    (input.priceCents !== undefined &&
      (!Number.isInteger(input.priceCents) || input.priceCents < 0))
  ) {
    throw new DemoPortalError("invalid_input", "Invalid catalog item.");
  }
  const productCategories = ["food", "classic-drink", "wine", "champagne", "raw-fish"];
  const activityCategories = ["fishing", "boat-trip", "lemon-grove", "other"];
  if (
    (input.kind === "product" && !productCategories.includes(input.category)) ||
    (input.kind === "activity" && !activityCategories.includes(input.category))
  ) {
    throw new DemoPortalError("invalid_input", "Category and item type do not match.");
  }
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
  const slug = (input.slug || existing?.slug || input.labels.en)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const common = {
    id: existing?.id ?? createId(input.kind),
    slug,
    labels: Object.fromEntries(
      Object.entries(input.labels).map(([locale, label]) => [locale, label.trim()]),
    ) as DemoCatalogItem["labels"],
    description: input.description,
    active: input.active ?? existing?.active ?? true,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? state.catalog.length * 10 + 10,
    priceCents: input.priceCents,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  const item = (
    input.kind === "product"
      ? { ...common, kind: "product", category: input.category }
      : { ...common, kind: "activity", category: input.category }
  ) as DemoCatalogItem;
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
