export { DemoPortalProvider, useDemoPortal } from "./context";
export type { DemoPortalContextValue } from "./context";
export {
  addDemoDays,
  assertValidStayRange,
  getRomeToday,
  isDateWithinStay,
  isDemoDate,
  isStayDateOrderable,
  listStayCalendarDates,
} from "./dates";
export {
  DEMO_ADMIN_CREDENTIALS,
  DEMO_GUEST_CREDENTIALS,
  createDemoPortalSeed,
  refreshDemoStayForToday,
} from "./seed";
export { createGuideSeedCatalog } from "./guide-seed";
export {
  authenticateDemoAccount,
  generateDemoPassword,
  hashDemoPassword,
  isDemoSessionCurrent,
  normaliseLoginCode,
  verifyDemoPassword,
} from "./security";
export {
  DEMO_LEGACY_SESSION_STORAGE_KEY,
  DEMO_LEGACY_STATE_STORAGE_KEY,
  DEMO_SESSION_STORAGE_KEY,
  DEMO_STATE_STORAGE_KEY,
  isDemoPortalState,
  isDemoPortalStateV3,
  loadDemoSession,
  loadDemoState,
  migrateDemoPortalStateV3,
  saveDemoSession,
  saveDemoState,
} from "./storage";
export type { DemoPortalStateV3, DemoStateSaveResult } from "./storage";
export * from "./types";
