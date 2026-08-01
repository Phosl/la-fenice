"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { DEMO_ADMIN_CREDENTIALS, useDemoPortal } from "@/lib/demo-portal";
import styles from "./admin.module.css";

const { loginCode: ADMIN_CODE, password: ADMIN_PASSWORD } = DEMO_ADMIN_CREDENTIALS;

export function AdminLogin() {
  const router = useRouter();
  const { login, ready, session } = useDemoPortal();
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && session?.role === "admin") {
      router.replace("/demo/admin");
    }
  }, [ready, router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError("");
    const result = await login(loginCode, password, "admin");

    if (result.ok) {
      router.replace("/demo/admin");
      return;
    }

    setError("Codice o password non corretti.");
    setPending(false);
  }

  if (!ready || session?.role === "admin") {
    return (
      <div aria-live="polite" className={styles.loadingState}>
        <span aria-hidden="true" className={styles.spinner} />
        <span>Preparazione della demo…</span>
      </div>
    );
  }

  return (
    <section aria-labelledby="admin-login-title" className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div>
          <span className="eyebrow">Area riservata · Demo</span>
          <h1 className={styles.loginHeading} id="admin-login-title">Accesso staff</h1>
        </div>
        <p className={styles.loginCopy}>
          Gestisci richieste, soggiorni, Shop e attività da un unico pannello.
          I dati restano esclusivamente in questo browser.
        </p>

        <div className={styles.demoCredential}>
          <span>Credenziali demo</span>
          <code>{ADMIN_CODE} · {ADMIN_PASSWORD}</code>
          <button
            className={styles.buttonGhost}
            onClick={() => {
              setLoginCode(ADMIN_CODE);
              setPassword(ADMIN_PASSWORD);
              setError("");
            }}
            type="button"
          >
            Compila i campi
          </button>
        </div>

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="admin-login-code">Codice amministratore</label>
            <input
              autoCapitalize="characters"
              autoComplete="username"
              id="admin-login-code"
              maxLength={60}
              onChange={(event) => setLoginCode(event.target.value)}
              required
              spellCheck={false}
              type="text"
              value={loginCode}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-login-password">Password</label>
            <input
              autoComplete="current-password"
              id="admin-login-password"
              maxLength={100}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <div aria-live="assertive" className={styles.errorNotice} role="alert">
              {error}
            </div>
          ) : null}

          <button
            className={styles.buttonPrimary}
            disabled={pending || !loginCode.trim() || !password}
            type="submit"
          >
            {pending ? "Accesso…" : "Entra nel pannello"}
          </button>
        </form>
      </div>
    </section>
  );
}
