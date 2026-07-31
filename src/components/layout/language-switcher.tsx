"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/content/types";

export interface LanguageOption {
  locale: Locale;
  label: string;
  href: string;
}

type LanguageSwitcherProps = {
  activeLocale: Locale;
  label: string;
  options: readonly LanguageOption[];
};

export function LanguageSwitcher({
  activeLocale,
  label,
  options,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const current = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"][aria-current="true"]',
    );
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    (current ?? first)?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (!items.length) return;

    event.preventDefault();
    const currentIndex = Math.max(0, items.indexOf(document.activeElement as HTMLElement));
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowUp"
            ? (currentIndex - 1 + items.length) % items.length
            : (currentIndex + 1) % items.length;
    items[nextIndex]?.focus();
  };

  return (
    <div className="language-switcher" ref={containerRef}>
      <button
        aria-controls="language-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="language-switcher__button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        {activeLocale.toUpperCase()}
        <span aria-hidden="true">⌄</span>
      </button>
      <div
        className="language-switcher__menu"
        hidden={!open}
        id="language-menu"
        onKeyDown={handleMenuKeyDown}
        ref={menuRef}
        role="menu"
      >
        {options.map((option) => (
          <a
            aria-current={option.locale === activeLocale ? "true" : undefined}
            href={option.href}
            hrefLang={option.locale}
            key={option.locale}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <span>{option.label}</span>
            <small>{option.locale.toUpperCase()}</small>
          </a>
        ))}
      </div>
    </div>
  );
}
