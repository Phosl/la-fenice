"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { switchLocalePath } from "@/lib/content/routes";
import type { Locale } from "@/lib/content/types";
import type { NavigationModel } from "@/lib/content/navigation";

type SiteHeaderProps = {
  locale: Locale;
  navigation: NavigationModel;
  openMenuLabel: string;
  closeMenuLabel: string;
  changeLanguageLabel: string;
  overlay?: boolean;
};

export function SiteHeader({
  locale,
  navigation,
  openMenuLabel,
  closeMenuLabel,
  changeLanguageLabel,
  overlay = true,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const otherLocale: Locale = locale === "en" ? "it" : "en";
  const localeHref = switchLocalePath(pathname, otherLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!overlay) return;
    const update = () => setHasScrolled(window.scrollY > 34);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [overlay]);

  useEffect(() => {
    if (!menuOpen) return;

    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <>
      <div
        aria-hidden={!menuOpen}
        aria-label={openMenuLabel}
        aria-modal="true"
        className="mobile-nav"
        data-open={menuOpen}
        ref={menuRef}
        role="dialog"
      >
        <nav aria-label="Mobile navigation" className="mobile-nav__inner">
          {navigation.primary.map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className="mobile-nav__link"
              href={item.href}
              key={item.route}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="button-primary"
            href={navigation.availability.href}
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            {navigation.availability.label}
          </Link>
          <div className="mobile-nav__meta">
            <span>{changeLanguageLabel}</span>
            <Link href={localeHref} hrefLang={otherLocale} tabIndex={menuOpen ? 0 : -1}>
              {otherLocale.toUpperCase()}
            </Link>
          </div>
        </nav>
      </div>

      <header
        className="site-header"
        data-condensed={!overlay || hasScrolled || menuOpen}
        data-overlay={overlay}
      >
        <div className="container site-header__inner">
          <Link aria-label="La Fenice Positano" className="site-header__brand" href={locale === "it" ? "/it" : "/"}>
            <LogoLockup compact />
          </Link>

          <nav aria-label="Primary navigation" className="desktop-nav">
            {navigation.primary.map((item) => (
              <Link
                aria-current={pathname === item.href ? "page" : undefined}
                className="desktop-nav__link"
                href={item.href}
                key={item.route}
              >
                {item.label}
              </Link>
            ))}
            <span className="language-switcher">
              <Link aria-label={`${changeLanguageLabel}: ${otherLocale.toUpperCase()}`} href={localeHref} hrefLang={otherLocale}>
                {otherLocale.toUpperCase()}
              </Link>
            </span>
            <Link className="button-primary" href={navigation.availability.href}>
              {navigation.availability.label}
            </Link>
          </nav>

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? closeMenuLabel : openMenuLabel}
            className="menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            ref={toggleRef}
            type="button"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <div className="mobile-availability">
        <Link className="button-primary" href={navigation.availability.href}>
          {navigation.availability.label}
        </Link>
      </div>
    </>
  );
}
