"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { LogoLockup } from "@/components/brand/logo-lockup";
import { PageTransition } from "@/components/layout/page-transition";
import { type DemoLocale, useDemoPortal } from "@/lib/demo-portal";

import styles from "./demo-chrome.module.css";

type DemoChromeProps = {
  children: React.ReactNode;
};

const chromeCopy: Record<DemoLocale, {
  admin: string;
  footer: string;
  guest: string;
  logout: string;
  notice: string;
  publicSite: string;
  skip: string;
}> = {
  en: {
    admin: "Administration",
    footer: "No data is sent or stored online.",
    guest: "Guest area",
    logout: "Sign out",
    notice: "Demo data — visible only in this browser",
    publicSite: "Public website",
    skip: "Skip to content",
  },
  it: {
    admin: "Amministrazione",
    footer: "Nessun dato viene inviato o salvato online.",
    guest: "Area ospite",
    logout: "Esci",
    notice: "Dati dimostrativi — visibili solo in questo browser",
    publicSite: "Sito pubblico",
    skip: "Salta al contenuto",
  },
  de: {
    admin: "Verwaltung",
    footer: "Es werden keine Daten online gesendet oder gespeichert.",
    guest: "Gästebereich",
    logout: "Abmelden",
    notice: "Demodaten — nur in diesem Browser sichtbar",
    publicSite: "Öffentliche Website",
    skip: "Zum Inhalt springen",
  },
  ru: {
    admin: "Управление",
    footer: "Данные не отправляются и не сохраняются онлайн.",
    guest: "Личный кабинет",
    logout: "Выйти",
    notice: "Демонстрационные данные видны только в этом браузере",
    publicSite: "Открыть сайт",
    skip: "Перейти к содержимому",
  },
};

export function DemoChrome({ children }: DemoChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentStay, logout, session } = useDemoPortal();
  const isAdmin = pathname.startsWith("/demo/admin");
  const locale: DemoLocale =
    session?.role === "guest" && currentStay ? currentStay.locale : "it";
  const copy = chromeCopy[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function handleLogout() {
    const role = session?.role;
    logout();
    router.push(role === "admin" ? "/demo/admin/login" : "/demo/login");
  }

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>

      <div className={styles.notice} role="status">
        <strong>Demo</strong>
        <span>{copy.notice}</span>
      </div>

      <header className={styles.header}>
        <Link aria-label="La Fenice Positano — demo" className={styles.brand} href="/demo/login">
          <LogoLockup compact />
          <span className={styles.demoBadge}>Demo</span>
        </Link>

        <nav aria-label="Navigazione demo" className={styles.navigation}>
          <Link aria-current={!isAdmin ? "page" : undefined} href="/demo/login">
            {copy.guest}
          </Link>
          <Link aria-current={isAdmin ? "page" : undefined} href="/demo/admin/login">
            {copy.admin}
          </Link>
          <Link className={styles.backLink} href="/">
            {copy.publicSite}
          </Link>
          {session ? (
            <button className={styles.logoutButton} onClick={handleLogout} type="button">
              {copy.logout}
            </button>
          ) : null}
        </nav>
      </header>

      <main className={styles.main} id="main-content">
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className={styles.footer}>
        <span>La Fenice Positano</span>
        <span>{copy.footer}</span>
      </footer>
    </div>
  );
}
