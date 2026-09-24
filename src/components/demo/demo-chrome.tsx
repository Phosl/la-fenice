"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { LogoLockup } from "@/components/brand/logo-lockup";
import { PageTransition } from "@/components/layout/page-transition";
import { type DemoLocale, useDemoPortal } from "@/lib/demo-portal";

import { endConciergeSession } from "./guest/concierge-client";
import { clearAllConciergeStorage } from "./guest/concierge-storage";
import styles from "./demo-chrome.module.css";

type DemoChromeProps = {
  children: React.ReactNode;
};

const chromeCopy: Record<DemoLocale, {
  admin: string;
  footer: string;
  guest: string;
  guestNavigation: string;
  guide: string;
  logout: string;
  notice: string;
  publicSite: string;
  skip: string;
  stay: string;
  storageError: string;
  retry: string;
}> = {
  en: {
    admin: "Administration",
    footer: "Demo data stays in this browser. When you use the concierge, OpenAI processes the question and relevant guide context.",
    guest: "Guest area",
    guestNavigation: "Guest navigation",
    guide: "Guide & concierge",
    logout: "Sign out",
    notice: "Demo data — visible only in this browser",
    publicSite: "Public website",
    skip: "Skip to content",
    stay: "Your stay",
    storageError: "Saved demo data could not be read. Nothing has been deleted or replaced. Try again or contact the team for help recovering it.",
    retry: "Try again",
  },
  it: {
    admin: "Amministrazione",
    footer: "I dati demo restano nel browser. Quando usi il concierge, OpenAI elabora la domanda e il contesto pertinente della guida.",
    guest: "Area ospite",
    guestNavigation: "Navigazione area ospite",
    guide: "Guida e concierge",
    logout: "Esci",
    notice: "Dati dimostrativi — visibili solo in questo browser",
    publicSite: "Sito pubblico",
    skip: "Salta al contenuto",
    stay: "Soggiorno",
    storageError: "Non è possibile leggere i dati demo salvati. Nulla è stato cancellato o sostituito. Riprova oppure contatta lo staff per recuperarli.",
    retry: "Riprova",
  },
  de: {
    admin: "Verwaltung",
    footer: "Demodaten bleiben im Browser. Bei Nutzung des Concierge verarbeitet OpenAI die Frage und den passenden Guide-Kontext.",
    guest: "Gästebereich",
    guestNavigation: "Navigation im Gästebereich",
    guide: "Guide & Concierge",
    logout: "Abmelden",
    notice: "Demodaten — nur in diesem Browser sichtbar",
    publicSite: "Öffentliche Website",
    skip: "Zum Inhalt springen",
    stay: "Aufenthalt",
    storageError: "Die gespeicherten Demodaten konnten nicht gelesen werden. Nichts wurde gelöscht oder ersetzt. Versuchen Sie es erneut oder bitten Sie das Team um Hilfe bei der Wiederherstellung.",
    retry: "Erneut versuchen",
  },
  ru: {
    admin: "Управление",
    footer: "Демо-данные остаются в браузере. При использовании консьержа OpenAI обрабатывает вопрос и подходящий контекст путеводителя.",
    guest: "Личный кабинет",
    guestNavigation: "Навигация личного кабинета",
    guide: "Гид и консьерж",
    logout: "Выйти",
    notice: "Демонстрационные данные видны только в этом браузере",
    publicSite: "Открыть сайт",
    skip: "Перейти к содержимому",
    stay: "Проживание",
    storageError: "Не удалось прочитать сохранённые демо-данные. Ничего не удалено и не заменено. Повторите попытку или обратитесь к команде за помощью в восстановлении.",
    retry: "Повторить попытку",
  },
};

export function DemoChrome({ children }: DemoChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { bootstrapError, currentStay, logout, session } = useDemoPortal();
  const isAdmin = pathname.startsWith("/demo/admin");
  const locale: DemoLocale =
    session?.role === "guest" && currentStay ? currentStay.locale : "it";
  const copy = chromeCopy[locale];
  const showGuestNavigation =
    session?.role === "guest" &&
    currentStay !== null &&
    (pathname.startsWith("/demo/stay") || pathname.startsWith("/demo/guide"));

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  async function handleLogout() {
    const role = session?.role;
    if (role === "guest") {
      clearAllConciergeStorage();
      await endConciergeSession();
    }
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
            <button
              className={styles.logoutButton}
              onClick={() => void handleLogout()}
              type="button"
            >
              {copy.logout}
            </button>
          ) : null}
        </nav>
      </header>

      {showGuestNavigation ? (
        <nav aria-label={copy.guestNavigation} className={styles.guestNavigation}>
          <Link
            aria-current={pathname.startsWith("/demo/stay") ? "page" : undefined}
            href="/demo/stay"
          >
            {copy.stay}
          </Link>
          <Link
            aria-current={pathname.startsWith("/demo/guide") ? "page" : undefined}
            href="/demo/guide"
          >
            {copy.guide}
          </Link>
        </nav>
      ) : null}

      <main className={styles.main} id="main-content">
        {bootstrapError ? (
          <section aria-label={copy.guest}>
            <p role="alert">{copy.storageError}</p>
            <button className={styles.logoutButton} onClick={() => window.location.reload()} type="button">
              {copy.retry}
            </button>
          </section>
        ) : <PageTransition>{children}</PageTransition>}
      </main>

      <footer className={styles.footer}>
        <span>La Fenice Positano</span>
        <span>{copy.footer}</span>
      </footer>
    </div>
  );
}
