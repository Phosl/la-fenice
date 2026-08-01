"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getRomeToday } from "./dates";
import {
  cancelGuestRequest,
  createGuestActivityRequest,
  createGuestOrder,
  createStayWithAccount,
  generateUniqueLoginCode,
  replaceAccountPasswordHash,
  saveAdminCatalogItem,
  toggleAdminCatalogItem,
  toggleAdminStay,
  updateAdminRequest,
  updateAdminStay,
  updateGuestLocale,
} from "./operations";
import {
  authenticateDemoAccount,
  generateDemoPassword,
  hashDemoPassword,
  isDemoSessionCurrent,
} from "./security";
import { createDemoPortalSeed, refreshDemoStayForToday } from "./seed";
import {
  loadDemoSession,
  loadDemoState,
  saveDemoSession,
  saveDemoState,
  subscribeToDemoState,
} from "./storage";
import type {
  DemoAccount,
  DemoActivityRequest,
  DemoActivityRequestInput,
  DemoCatalogItem,
  DemoCatalogItemInput,
  DemoCreateStayInput,
  DemoCreatedStay,
  DemoLoginResult,
  DemoOrder,
  DemoOrderInput,
  DemoPasswordReset,
  DemoPortalState,
  DemoRole,
  DemoSession,
  DemoStay,
  DemoStayPatch,
  DemoUpdateRequestInput,
} from "./types";
import { DemoPortalError } from "./types";

export interface DemoPortalContextValue {
  ready: boolean;
  state: DemoPortalState | null;
  session: DemoSession | null;
  today: string;
  currentAccount: DemoAccount | null;
  currentStay: DemoStay | null;
  lastMutationError: DemoPortalError | null;
  clearMutationError: () => void;
  login: (
    loginCode: string,
    password: string,
    expectedRole?: DemoRole,
  ) => Promise<DemoLoginResult>;
  logout: () => void;
  resetDemo: () => Promise<void>;
  setGuestLocale: (locale: DemoStay["locale"]) => void;
  createOrder: (input: DemoOrderInput) => DemoOrder;
  cancelOrder: (id: string) => void;
  createActivityRequest: (input: DemoActivityRequestInput) => DemoActivityRequest;
  cancelActivityRequest: (id: string) => void;
  createStay: (input: DemoCreateStayInput) => Promise<DemoCreatedStay>;
  updateStay: (stayId: string, patch: DemoStayPatch) => void;
  toggleStay: (stayId: string, active?: boolean) => void;
  resetGuestPassword: (accountId: string) => Promise<DemoPasswordReset>;
  saveCatalogItem: (input: DemoCatalogItemInput) => DemoCatalogItem;
  toggleCatalogItem: (itemId: string, active?: boolean) => void;
  updateRequest: (input: DemoUpdateRequestInput) => void;
}

const DemoPortalContext = createContext<DemoPortalContextValue | null>(null);

export function DemoPortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoPortalState | null>(null);
  const stateRef = useRef<DemoPortalState | null>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const sessionRef = useRef<DemoSession | null>(null);
  const [ready, setReady] = useState(false);
  const [lastMutationError, setLastMutationError] =
    useState<DemoPortalError | null>(null);
  const today = getRomeToday();

  const validateCurrentSession = useCallback((next: DemoPortalState) => {
    const currentSession = sessionRef.current;
    if (currentSession && !isDemoSessionCurrent(next.accounts, currentSession)) {
      sessionRef.current = null;
      setSession(null);
      saveDemoSession(null);
    }
  }, []);

  const replaceState = useCallback(
    (next: DemoPortalState) => {
      const current = stateRef.current;
      const candidate =
        current && next.revision <= current.revision
          ? { ...next, revision: current.revision + 1 }
          : next;
      const saveResult = saveDemoState(candidate, current?.revision);
      if (!saveResult.ok && saveResult.reason === "concurrent_update") {
        if (saveResult.current) {
          stateRef.current = saveResult.current;
          setState(saveResult.current);
          validateCurrentSession(saveResult.current);
        }
        const error = new DemoPortalError(
          "concurrent_update",
          "The demo changed in another tab. Review the latest data and retry.",
        );
        setLastMutationError(error);
        throw error;
      }
      stateRef.current = candidate;
      setState(candidate);
      setLastMutationError(null);
      validateCurrentSession(candidate);
    },
    [validateCurrentSession],
  );

  const requireState = useCallback(() => {
    if (!stateRef.current) {
      throw new DemoPortalError("not_ready", "The demo is still loading.");
    }
    return stateRef.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const stored = loadDemoState();
      let initial = stored
        ? refreshDemoStayForToday(stored)
        : await createDemoPortalSeed();
      if (stored && initial !== stored) {
        const saveResult = saveDemoState(initial, stored.revision);
        if (
          !saveResult.ok &&
          saveResult.reason === "concurrent_update" &&
          saveResult.current
        ) {
          initial = saveResult.current;
        }
      } else if (!stored) {
        saveDemoState(initial);
      }
      if (cancelled) return;
      stateRef.current = initial;
      setState(initial);
      const storedSession = loadDemoSession();
      const validSession = isDemoSessionCurrent(initial.accounts, storedSession)
        ? storedSession
        : null;
      sessionRef.current = validSession;
      setSession(validSession);
      if (!validSession) saveDemoSession(null);
      setReady(true);
    };
    void bootstrap();
    const unsubscribe = subscribeToDemoState((next) => {
      const persisted = loadDemoState();
      const incoming =
        persisted && persisted.revision >= next.revision ? persisted : next;
      const current = stateRef.current;
      if (current && incoming.revision < current.revision) return;
      if (
        current &&
        incoming.revision === current.revision &&
        JSON.stringify(incoming) === JSON.stringify(current)
      ) {
        return;
      }
      stateRef.current = incoming;
      setState(incoming);
      validateCurrentSession(incoming);
      if (current && incoming.revision === current.revision) {
        setLastMutationError(
          new DemoPortalError(
            "concurrent_update",
            "The demo changed in another tab. Review the latest data and retry.",
          ),
        );
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [validateCurrentSession]);

  const login = useCallback(
    async (loginCode: string, password: string, expectedRole?: DemoRole) => {
      const current = requireState();
      const result = await authenticateDemoAccount(
        current.accounts,
        loginCode,
        password,
        expectedRole,
      );
      if (!result.ok) return result;
      if (
        result.account.role === "guest" &&
        !current.stays.some(
          (stay) => stay.id === result.account.stayId && stay.active,
        )
      ) {
        return { ok: false, reason: "missing_stay" } as const;
      }
      const nextSession: DemoSession = {
        accountId: result.account.id,
        loginCode: result.account.loginCode,
        role: result.account.role,
        credentialVersion: result.account.credentialVersion,
        createdAt: new Date().toISOString(),
      };
      sessionRef.current = nextSession;
      setSession(nextSession);
      saveDemoSession(nextSession);
      return { ok: true, role: result.account.role } as const;
    },
    [requireState],
  );

  const logout = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    saveDemoSession(null);
  }, []);

  const clearMutationError = useCallback(() => setLastMutationError(null), []);

  const resetDemo = useCallback(async () => {
    const next = await createDemoPortalSeed();
    replaceState(next);
    sessionRef.current = null;
    setSession(null);
    saveDemoSession(null);
  }, [replaceState]);

  const setGuestLocale = useCallback(
    (locale: DemoStay["locale"]) => {
      replaceState(updateGuestLocale(requireState(), sessionRef.current, locale));
    },
    [replaceState, requireState],
  );

  const createOrder = useCallback(
    (input: DemoOrderInput) => {
      const result = createGuestOrder(
        requireState(),
        sessionRef.current,
        input,
        getRomeToday(),
      );
      if (result.state !== stateRef.current) replaceState(result.state);
      return result.order;
    },
    [replaceState, requireState],
  );

  const cancelOrder = useCallback(
    (id: string) =>
      replaceState(cancelGuestRequest(requireState(), sessionRef.current, "order", id)),
    [replaceState, requireState],
  );

  const createActivityRequest = useCallback(
    (input: DemoActivityRequestInput) => {
      const result = createGuestActivityRequest(
        requireState(),
        sessionRef.current,
        input,
        getRomeToday(),
      );
      if (result.state !== stateRef.current) replaceState(result.state);
      return result.request;
    },
    [replaceState, requireState],
  );

  const cancelActivityRequest = useCallback(
    (id: string) =>
      replaceState(
        cancelGuestRequest(requireState(), sessionRef.current, "activity", id),
      ),
    [replaceState, requireState],
  );

  const createStay = useCallback(
    async (input: DemoCreateStayInput) => {
      const current = requireState();
      const password = input.password?.trim() || generateDemoPassword();
      const loginCode = input.loginCode?.trim() || generateUniqueLoginCode(current, input.surname);
      const passwordHash = await hashDemoPassword(password);
      const result = createStayWithAccount(
        requireState(),
        sessionRef.current,
        input,
        passwordHash,
        loginCode,
      );
      replaceState(result.state);
      return {
        account: result.account,
        stay: result.stay,
        credential: { loginCode: result.account.loginCode, password },
      };
    },
    [replaceState, requireState],
  );

  const updateStay = useCallback(
    (stayId: string, patch: DemoStayPatch) =>
      replaceState(updateAdminStay(requireState(), sessionRef.current, stayId, patch)),
    [replaceState, requireState],
  );

  const toggleStay = useCallback(
    (stayId: string, active?: boolean) =>
      replaceState(toggleAdminStay(requireState(), sessionRef.current, stayId, active)),
    [replaceState, requireState],
  );

  const resetGuestPassword = useCallback(
    async (accountId: string) => {
      const password = generateDemoPassword();
      const passwordHash = await hashDemoPassword(password);
      const current = requireState();
      const account = current.accounts.find((candidate) => candidate.id === accountId);
      const next = replaceAccountPasswordHash(
        current,
        sessionRef.current,
        accountId,
        passwordHash,
      );
      replaceState(next);
      return {
        credential: { loginCode: account?.loginCode ?? "", password },
      };
    },
    [replaceState, requireState],
  );

  const saveCatalogItem = useCallback(
    (input: DemoCatalogItemInput) => {
      const result = saveAdminCatalogItem(requireState(), sessionRef.current, input);
      replaceState(result.state);
      return result.item;
    },
    [replaceState, requireState],
  );

  const toggleCatalogItem = useCallback(
    (itemId: string, active?: boolean) =>
      replaceState(
        toggleAdminCatalogItem(requireState(), sessionRef.current, itemId, active),
      ),
    [replaceState, requireState],
  );

  const updateRequest = useCallback(
    (input: DemoUpdateRequestInput) =>
      replaceState(updateAdminRequest(requireState(), sessionRef.current, input)),
    [replaceState, requireState],
  );

  const currentAccount = useMemo(
    () => state?.accounts.find((account) => account.id === session?.accountId) ?? null,
    [session?.accountId, state],
  );
  const currentStay = useMemo(
    () =>
      currentAccount?.stayId
        ? state?.stays.find((stay) => stay.id === currentAccount.stayId) ?? null
        : null,
    [currentAccount, state],
  );

  const value = useMemo<DemoPortalContextValue>(
    () => ({
      ready,
      state,
      session,
      today,
      currentAccount,
      currentStay,
      lastMutationError,
      clearMutationError,
      login,
      logout,
      resetDemo,
      setGuestLocale,
      createOrder,
      cancelOrder,
      createActivityRequest,
      cancelActivityRequest,
      createStay,
      updateStay,
      toggleStay,
      resetGuestPassword,
      saveCatalogItem,
      toggleCatalogItem,
      updateRequest,
    }),
    [
      ready,
      state,
      session,
      today,
      currentAccount,
      currentStay,
      lastMutationError,
      clearMutationError,
      login,
      logout,
      resetDemo,
      setGuestLocale,
      createOrder,
      cancelOrder,
      createActivityRequest,
      cancelActivityRequest,
      createStay,
      updateStay,
      toggleStay,
      resetGuestPassword,
      saveCatalogItem,
      toggleCatalogItem,
      updateRequest,
    ],
  );

  return <DemoPortalContext.Provider value={value}>{children}</DemoPortalContext.Provider>;
}

export function useDemoPortal(): DemoPortalContextValue {
  const context = useContext(DemoPortalContext);
  if (!context) throw new Error("useDemoPortal must be used inside DemoPortalProvider.");
  return context;
}
