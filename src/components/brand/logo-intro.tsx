"use client";

import { type AnimationEvent, useCallback, useEffect, useRef, useState } from "react";
import type { IntroControlsCopy } from "@/lib/content/types";
import { IntroAtmosphere } from "./intro-atmosphere";
import { LogoLockup } from "./logo-lockup";

const INTRO_KEY = "la-fenice-intro-seen";
const MANUAL_DISMISS_FAILSAFE_MS = 360;
const REPLAYABLE_ANIMATIONS = new Set([
  "intro-horizon",
  "intro-mark-reveal",
  "intro-mist",
  "intro-water-fallback",
]);

type LogoIntroProps = {
  controls: IntroControlsCopy;
};

export function LogoIntro({ controls }: LogoIntroProps) {
  const [closing, setClosing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [logoIntegrated, setLogoIntegrated] = useState(false);
  const [replayAnnouncementId, setReplayAnnouncementId] = useState(0);
  const [replayId, setReplayId] = useState(0);
  const closingRef = useRef(false);
  const inertTargetsRef = useRef<Array<{ element: HTMLElement; wasInert: boolean }>>([]);
  const enterButtonRef = useRef<HTMLButtonElement>(null);
  const finishTimerRef = useRef<number | null>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const logoTargetRef = useRef<HTMLSpanElement>(null);
  const reloadButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  const restoreInertTargets = useCallback(() => {
    for (const { element, wasInert } of inertTargetsRef.current) {
      if (!wasInert) element.removeAttribute("inert");
    }
    inertTargetsRef.current = [];
  }, []);

  const handleLogoIntegrationChange = useCallback((integrated: boolean) => {
    setLogoIntegrated(integrated);
  }, []);

  const finishDismiss = useCallback(() => {
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
      restoreFocusRef.current ||
      document.activeElement === enterButtonRef.current ||
      document.activeElement === reloadButtonRef.current;
    enterButtonRef.current?.blur();
    reloadButtonRef.current?.blur();
    restoreInertTargets();
    document.documentElement.classList.remove("intro-active");
    document.documentElement.classList.add("intro-seen");
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
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    setClosing(true);
    finishTimerRef.current = window.setTimeout(
      finishDismiss,
      MANUAL_DISMISS_FAILSAFE_MS,
    );
  }, [finishDismiss]);

  const handleReload = useCallback(() => {
    if (closingRef.current) return;

    setReplayId((current) => current + 1);
    setReplayAnnouncementId((current) => current + 1);

    for (const animation of introRef.current?.getAnimations({ subtree: true }) ?? []) {
      const animationName = (animation as CSSAnimation).animationName;
      if (!REPLAYABLE_ANIMATIONS.has(animationName)) continue;
      animation.currentTime = 0;
      animation.play();
    }

    reloadButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    if (dismissed) return;

    if (document.documentElement.classList.contains("intro-seen")) {
      const hiddenIntroTimer = window.setTimeout(() => setDismissed(true), 0);
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
    const focusFrame = window.requestAnimationFrame(() => {
      enterButtonRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginDismiss();
      } else if (event.key === "Tab") {
        const focusableControls = [
          enterButtonRef.current,
          reloadButtonRef.current,
        ].filter(
          (button): button is HTMLButtonElement =>
            Boolean(
              button &&
                !button.disabled &&
                button.getClientRects().length > 0,
            ),
        );

        if (focusableControls.length === 0) return;
        event.preventDefault();
        const currentIndex = focusableControls.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const nextIndex = event.shiftKey
          ? currentIndex <= 0
            ? focusableControls.length - 1
            : currentIndex - 1
          : currentIndex < 0 || currentIndex === focusableControls.length - 1
            ? 0
            : currentIndex + 1;
        focusableControls[nextIndex]?.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      restoreInertTargets();
      document.documentElement.classList.remove("intro-active");
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
    };
  }, [beginDismiss, dismissed, finishDismiss, restoreInertTargets]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (
      event.currentTarget === event.target &&
      event.animationName === "intro-shell-dismiss"
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
      data-logo-mode={logoIntegrated ? "texture" : "dom"}
      data-replay-id={replayId}
      onAnimationEnd={handleAnimationEnd}
      ref={introRef}
      role="dialog"
    >
      <IntroAtmosphere
        active={!closing}
        logoTargetRef={logoTargetRef}
        onLogoIntegrationChange={handleLogoIntegrationChange}
        replayId={replayId}
      />
      <div className="logo-intro__mark">
        <span className="logo-intro__logo-target" ref={logoTargetRef}>
          <LogoLockup priority />
        </span>
        <span aria-hidden="true" className="logo-intro__horizon" />
      </div>
      <div className="logo-intro__controls">
        <button
          className="button-primary logo-intro__control logo-intro__enter"
          onClick={beginDismiss}
          ref={enterButtonRef}
          type="button"
        >
          {controls.enter}
        </button>
        <button
          className="button-secondary logo-intro__control logo-intro__reload"
          onClick={handleReload}
          ref={reloadButtonRef}
          type="button"
        >
          {controls.reload}
        </button>
      </div>
      <span
        aria-atomic="true"
        aria-live="polite"
        className="logo-intro__status"
        role="status"
      >
        {replayAnnouncementId > 0 ? (
          <span key={replayAnnouncementId}>
            {controls.reloadedAnnouncement}
          </span>
        ) : null}
      </span>
    </div>
  );
}
