"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useDemoPortal } from "@/lib/demo-portal";

export function useGuestPortalAccess() {
  const router = useRouter();
  const portal = useDemoPortal();
  const { currentAccount, currentStay, logout, ready, session, state } = portal;
  const authenticated =
    ready &&
    session?.role === "guest" &&
    currentAccount?.active === true &&
    currentStay?.active === true &&
    state !== null;

  useEffect(() => {
    if (!ready || authenticated) return;
    if (session) logout();
    router.replace("/demo/login");
  }, [authenticated, logout, ready, router, session]);

  return { ...portal, authenticated };
}
