export const DEMO_PORTAL_VERSION = 4 as const;

export const DEMO_LOCALES = ["en", "it", "de", "ru"] as const;
export type DemoLocale = (typeof DEMO_LOCALES)[number];

export type DemoRole = "guest" | "admin";
export type DemoDate = string;
export type DemoRequestStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "fulfilled"
  | "cancelled";

export type DemoLocalizedLabel = Record<DemoLocale, string>;

export interface DemoAccount {
  id: string;
  loginCode: string;
  passwordHash: string;
  credentialVersion: number;
  role: DemoRole;
  active: boolean;
  stayId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoStay {
  id: string;
  accountId: string;
  surname: string;
  guestName: string;
  checkIn: DemoDate;
  checkOut: DemoDate;
  room: string;
  guests: number;
  locale: DemoLocale;
  active: boolean;
  autoAnchorToToday: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DemoCatalogItemBase {
  id: string;
  slug: string;
  labels: DemoLocalizedLabel;
  description?: DemoLocalizedLabel;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface DemoPricedCatalogItemBase extends DemoCatalogItemBase {
  priceCents?: number;
}

export type DemoProductCategory =
  | "food"
  | "classic-drink"
  | "wine"
  | "champagne"
  | "raw-fish";

export interface DemoProductCatalogItem extends DemoPricedCatalogItemBase {
  kind: "product";
  category: DemoProductCategory;
}

export type DemoActivityCategory =
  | "fishing"
  | "boat-trip"
  | "lemon-grove"
  | "other";

export interface DemoActivityCatalogItem extends DemoPricedCatalogItemBase {
  kind: "activity";
  category: DemoActivityCategory;
}

export const DEMO_GUIDE_CATEGORIES = [
  "dining",
  "after-dark",
  "sea",
  "see",
  "getting-around",
  "essentials",
] as const;
export type DemoGuideCategory = (typeof DEMO_GUIDE_CATEGORIES)[number];

export interface DemoGuideCatalogItem extends DemoCatalogItemBase {
  kind: "guide";
  category: DemoGuideCategory;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  mapsUrl?: string;
  bookingNote?: DemoLocalizedLabel;
  requestable: boolean;
  verifiedAt: string;
}

export type DemoCatalogItem =
  | DemoProductCatalogItem
  | DemoActivityCatalogItem
  | DemoGuideCatalogItem;

export type DemoDeliveryLocation = "room" | "pool" | "beach";

export interface DemoOrderLine {
  id: string;
  catalogItemId: string;
  quantity: number;
  labelSnapshot: DemoLocalizedLabel;
  unitPriceCents?: number;
}

export interface DemoOrder {
  id: string;
  stayId: string;
  serviceDate: DemoDate;
  location: DemoDeliveryLocation;
  requestedTime: string;
  notes: string;
  lines: DemoOrderLine[];
  status: DemoRequestStatus;
  staffNote: string;
  clientRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoActivityRequest {
  id: string;
  stayId: string;
  activityId: string;
  activityLabelSnapshot: DemoLocalizedLabel;
  requestedDate: DemoDate;
  preferredTime: string;
  participants: number;
  notes: string;
  status: DemoRequestStatus;
  staffNote: string;
  clientRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoGuideRequest {
  id: string;
  stayId: string;
  guideItemId: string;
  guideLabelSnapshot: DemoLocalizedLabel;
  requestedDate: DemoDate;
  preferredTime: string;
  participants: number;
  notes: string;
  status: DemoRequestStatus;
  staffNote: string;
  clientRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSession {
  accountId: string;
  loginCode: string;
  role: DemoRole;
  credentialVersion: number;
  createdAt: string;
}

export interface DemoPortalState {
  version: typeof DEMO_PORTAL_VERSION;
  revision: number;
  accounts: DemoAccount[];
  stays: DemoStay[];
  catalog: DemoCatalogItem[];
  orders: DemoOrder[];
  activityRequests: DemoActivityRequest[];
  guideRequests: DemoGuideRequest[];
  updatedAt: string;
}

export type DemoLoginFailureReason =
  | "invalid_credentials"
  | "inactive_account"
  | "missing_stay"
  | "wrong_role";

export type DemoLoginResult =
  | { ok: true; role: DemoRole }
  | { ok: false; reason: DemoLoginFailureReason };

export interface DemoOrderInput {
  serviceDate: DemoDate;
  location: DemoDeliveryLocation;
  requestedTime: string;
  notes?: string;
  lines: Array<{ catalogItemId: string; quantity: number }>;
  clientRequestId?: string;
}

export interface DemoActivityRequestInput {
  activityId: string;
  requestedDate: DemoDate;
  preferredTime: string;
  participants: number;
  notes?: string;
  clientRequestId?: string;
}

export interface DemoGuideRequestInput {
  guideItemId: string;
  requestedDate: DemoDate;
  preferredTime: string;
  participants: number;
  notes?: string;
  clientRequestId?: string;
}

export interface DemoCreateStayInput {
  surname: string;
  guestName?: string;
  checkIn: DemoDate;
  checkOut: DemoDate;
  room: string;
  guests: number;
  locale: DemoLocale;
  loginCode?: string;
  password?: string;
}

export type DemoStayPatch = Partial<
  Pick<
    DemoStay,
    | "surname"
    | "guestName"
    | "checkIn"
    | "checkOut"
    | "room"
    | "guests"
    | "locale"
  >
>;

interface DemoCatalogItemInputBase {
  id?: string;
  slug?: string;
  labels: DemoLocalizedLabel;
  description?: DemoLocalizedLabel;
  active?: boolean;
  sortOrder?: number;
}

export interface DemoProductCatalogItemInput extends DemoCatalogItemInputBase {
  kind: "product";
  category: DemoProductCategory;
  priceCents?: number;
}

export interface DemoActivityCatalogItemInput extends DemoCatalogItemInputBase {
  kind: "activity";
  category: DemoActivityCategory;
  priceCents?: number;
}

export interface DemoGuideCatalogItemInput extends DemoCatalogItemInputBase {
  kind: "guide";
  category: DemoGuideCategory;
  priceCents?: never;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  mapsUrl?: string;
  bookingNote?: DemoLocalizedLabel;
  requestable: boolean;
  verifiedAt: string;
}

export type DemoCatalogItemInput =
  | DemoProductCatalogItemInput
  | DemoActivityCatalogItemInput
  | DemoGuideCatalogItemInput;

export interface DemoUpdateRequestInput {
  kind: "order" | "activity" | "guide";
  id: string;
  status: DemoRequestStatus;
  staffNote?: string;
}

export interface DemoOneTimeCredential {
  loginCode: string;
  password: string;
}

export interface DemoCreatedStay {
  account: DemoAccount;
  stay: DemoStay;
  credential: DemoOneTimeCredential;
}

export interface DemoPasswordReset {
  credential: DemoOneTimeCredential;
}

export type DemoPortalErrorCode =
  | "not_ready"
  | "unauthorized"
  | "invalid_date"
  | "invalid_stay"
  | "date_not_orderable"
  | "inactive_stay"
  | "invalid_input"
  | "not_found"
  | "duplicate_login_code"
  | "invalid_status_transition"
  | "concurrent_update";

export class DemoPortalError extends Error {
  constructor(
    public readonly code: DemoPortalErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DemoPortalError";
  }
}
