"use client";

import { type AnimationEvent, useCallback, useEffect, useRef, useState } from "react";
import { IntroAtmosphere } from "./intro-atmosphere";
import { LogoLockup } from "./logo-lockup";

const INTRO_KEY = "la-fenice-intro-seen";
const INTRO_FAILSAFE_MS = 1650;
const INTRO_ATMOSPHERE_MS = 1050;
const REDUCED_MOTION_FAILSAFE_MS = 120;
const MANUAL_DISMISS_FAILSAFE_MS = 360;

export function LogoIntro({ skipLabel }: { skipLabel: string }) {
  const [atmosphereActive, setAtmosphereActive] = useState(true);
  const [closing, setClosing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const closingRef = useRef(false);
  const atmosphereTimerRef = useRef<number | null>(null);
  const inertTargetsRef = useRef<Array<{ element: HTMLElement; wasInert: boolean }>>([]);
  const finishTimerRef = useRef<number | null>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  const restoreInertTargets = useCallback(() => {
    for (const { element, wasInert } of inertTargetsRef.current) {
      if (!wasInert) element.removeAttribute("inert");
    }
    inertTargetsRef.current = [];
  }, []);

  const finishDismiss = useCallback(() => {
    if (atmosphereTimerRef.current !== null) {
      window.clearTimeout(atmosphereTimerRef.current);
      atmosphereTimerRef.current = null;
    }
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    try {
      window.sessionStorage.setItem(INTRO_KEY, "true");
    } catch {
      // Storage can be unavailable in privacy modes; the intro still dismisses.
    }
    const shouldRestoreFocus =
      restoreFocusRef.current || document.activeElement === skipButtonRef.current;
    skipButtonRef.current?.blur();
    restoreInertTargets();
    document.documentElement.classList.remove("intro-active");
    document.documentElement.classList.add("intro-seen");
    setAtmosphereActive(false);
    setDismissed(true);

    if (shouldRestoreFocus) {
      const main = document.querySelector<HTMLElement>("#main-content");
      if (main) {
        const previousTabIndex = main.getAttribute("tabindex");
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
        main.addEventListener(
          "blur",
          () => {
            if (previousTabIndex === null) main.removeAttribute("tabindex");
            else main.setAttribute("tabindex", previousTabIndex);
          },
          { once: true },
        );
      }
    }
  }, [restoreInertTargets]);

  const beginDismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    restoreFocusRef.current = true;
    if (atmosphereTimerRef.current !== null) {
      window.clearTimeout(atmosphereTimerRef.current);
      atmosphereTimerRef.current = null;
    }
    setAtmosphereActive(false);
    setClosing(true);
    finishTimerRef.current = window.setTimeout(
      finishDismiss,
      MANUAL_DISMISS_FAILSAFE_MS,
    );
  }, [finishDismiss]);

  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    if (dismissed) return;

    if (document.documentElement.classList.contains("intro-seen")) {
      const hiddenIntroTimer = window.setTimeout(() => {
        setAtmosphereActive(false);
        setDismissed(true);
      }, 0);
      return () => window.clearTimeout(hiddenIntroTimer);
    }

    const intro = introRef.current;
    if (!intro || getComputedStyle(intro).visibility === "hidden") {
      finishDismiss();
      return;
    }

    inertTargetsRef.current = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element !== intro &&
          element.tagName !== "SCRIPT",
      )
      .map((element) => ({ element, wasInert: element.hasAttribute("inert") }));
    for (const { element } of inertTargetsRef.current) {
      element.setAttribute("inert", "");
    }

    document.documentElement.classList.add("intro-active");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) {
      atmosphereTimerRef.current = window.setTimeout(() => {
        atmosphereTimerRef.current = null;
        setAtmosphereActive(false);
      }, INTRO_ATMOSPHERE_MS);
    }
    finishTimerRef.current = window.setTimeout(
      finishDismiss,
      reducedMotion ? REDUCED_MOTION_FAILSAFE_MS : INTRO_FAILSAFE_MS,
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginDismiss();
      } else if (event.key === "Tab") {
        event.preventDefault();
        skipButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      restoreInertTargets();
      document.documentElement.classList.remove("intro-active");
      if (atmosphereTimerRef.current !== null) {
        window.clearTimeout(atmosphereTimerRef.current);
      }
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
    };
  }, [beginDismiss, dismissed, finishDismiss, restoreInertTargets]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (
      event.currentTarget === event.target &&
      (event.animationName === "intro-shell" ||
        event.animationName === "intro-shell-dismiss")
    ) {
      finishDismiss();
    }
  };

  if (dismissed) return null;

  return (
    <div
      aria-label="La Fenice Positano"
      aria-modal="true"
      className="logo-intro"
      data-closing={closing ? "true" : undefined}
      onAnimationEnd={handleAnimationEnd}
      ref={introRef}
      role="dialog"
    >
      <IntroAtmosphere active={atmosphereActive && !closing} />
      <div className="logo-intro__mark">
        <LogoLockup priority />
        <span aria-hidden="true" className="logo-intro__horizon" />
      </div>
      <button
        className="logo-intro__skip"
        onClick={beginDismiss}
        ref={skipButtonRef}
        type="button"
      >
        {skipLabel}
      </button>
    </div>
  );
}
