"use client";

import { useCallback, useEffect } from "react";
import { LogoLockup } from "./logo-lockup";

const INTRO_KEY = "la-fenice-intro-seen";
const INTRO_DURATION_MS = 1650;

export function LogoIntro() {
  const dismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_KEY, "true");
    } catch {
      // Storage can be unavailable in privacy modes; the intro still dismisses.
    }
    document.documentElement.classList.add("intro-seen");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";

    if (document.documentElement.classList.contains("intro-seen")) return;

    const timer = window.setTimeout(dismiss, INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss]);

  return (
    <div aria-label="La Fenice Positano" aria-live="polite" className="logo-intro" role="status">
      <div className="logo-intro__halo" />
      <LogoLockup />
      <button className="logo-intro__skip" onClick={dismiss} type="button">
        Salta / Skip
      </button>
    </div>
  );
}
