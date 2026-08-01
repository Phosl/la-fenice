"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import type { Locale } from "@/lib/content/types";
import { useDemoPortal } from "@/lib/demo-portal";

import { guestDemoCopy, guestDemoLocales, isGuestDemoLocale } from "./copy";
import styles from "./guest.module.css";

const DEMO_CODE = "ROSSI-27";
const DEMO_PASSWORD = "Fenice2026!";

type CopiedField = "code" | "password" | null;

export function GuestLogin() {
  const router = useRouter();
  const { login, ready, session, setGuestLocale } = useDemoPortal();
  const [locale, setLocale] = useState<Locale>("it");
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState<CopiedField>(null);
  const pendingLocaleRef = useRef<Locale | null>(null);
  const copy = guestDemoCopy[locale];

  useEffect(() => {
    if (ready && session?.role === "guest") {
      const pendingLocale = pendingLocaleRef.current;
      pendingLocaleRef.current = null;
      if (pendingLocale) setGuestLocale(pendingLocale);
      router.replace("/demo/stay");
    }
  }, [ready, router, session, setGuestLocale]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(false);
    const result = await login(loginCode, password, "guest");

    if (result.ok) {
      pendingLocaleRef.current = locale;
      return;
    }

    setError(true);
    setPending(false);
  }

  async function copyCredential(field: Exclude<CopiedField, null>, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      if (field === "code") setLoginCode(value);
      if (field === "password") setPassword(value);
    }
  }

  if (!ready || session?.role === "guest") {
    return (
      <div aria-live="polite" className={styles.loadingCard} role="status">
        {copy.loading}
      </div>
    );
  }

  return (
    <section aria-labelledby="guest-login-title" className={styles.loginPage} lang={locale}>
      <div className={styles.loginIntro}>
        <div>
          <span className={styles.eyebrow}>{copy.login.eyebrow}</span>
          <h1 className={styles.loginTitle} id="guest-login-title">
            {copy.login.title}
          </h1>
          <p className={styles.loginLead}>{copy.login.lead}</p>
        </div>

        <aside aria-labelledby="demo-credentials-title" className={styles.credentials}>
          <h2 id="demo-credentials-title">{copy.login.credentialsTitle}</h2>
          <p>{copy.login.credentialsHint}</p>
          <div className={styles.credentialRows}>
            <div className={styles.credentialRow}>
              <span>{copy.login.codeValue}</span>
              <code>{DEMO_CODE}</code>
              <button
                className={styles.copyButton}
                onClick={() => void copyCredential("code", DEMO_CODE)}
                type="button"
              >
                {copied === "code" ? copy.login.copied : copy.login.copy}
              </button>
            </div>
            <div className={styles.credentialRow}>
              <span>{copy.login.passwordValue}</span>
              <code>{DEMO_PASSWORD}</code>
              <button
                className={styles.copyButton}
                onClick={() => void copyCredential("password", DEMO_PASSWORD)}
                type="button"
              >
                {copied === "password" ? copy.login.copied : copy.login.copy}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.loginCard}>
        <div className={styles.languageField}>
          <label htmlFor="guest-language">{copy.login.languageLabel}</label>
          <select
            id="guest-language"
            onChange={(event) => {
              if (isGuestDemoLocale(event.target.value)) setLocale(event.target.value);
            }}
            value={locale}
          >
            {guestDemoLocales.map((optionLocale) => (
              <option key={optionLocale} value={optionLocale}>
                {guestDemoCopy[optionLocale].languageName}
              </option>
            ))}
          </select>
        </div>

        <form className={styles.loginForm} noValidate onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="guest-login-code">{copy.login.codeLabel}</label>
            <input
              autoCapitalize="characters"
              autoComplete="username"
              id="guest-login-code"
              maxLength={60}
              onChange={(event) => setLoginCode(event.target.value)}
              placeholder={copy.login.codePlaceholder}
              required
              spellCheck={false}
              type="text"
              value={loginCode}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="guest-login-password">{copy.login.passwordLabel}</label>
            <input
              autoComplete="current-password"
              id="guest-login-password"
              maxLength={100}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.login.passwordPlaceholder}
              required
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <div aria-live="assertive" className={styles.errorNotice} role="alert">
              {copy.login.error}
            </div>
          ) : null}

          <button
            className={styles.primaryButton}
            disabled={pending || !loginCode.trim() || !password}
            type="submit"
          >
            {pending ? copy.login.submitting : copy.login.submit}
          </button>
        </form>

        <p className={styles.securityNote}>{copy.login.securityNote}</p>
      </div>
    </section>
  );
}
