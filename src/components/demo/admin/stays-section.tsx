"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  DEMO_LOCALES,
  addDemoDays,
  type DemoLocale,
  type DemoOneTimeCredential,
  type DemoStay,
  useDemoPortal,
} from "@/lib/demo-portal";
import { AdminModal, CredentialModal, formatAdminDate } from "./admin-ui";
import styles from "./admin.module.css";

const localeNames: Record<DemoLocale, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  ru: "Русский",
};

export function StaysSection() {
  const {
    createStay,
    resetGuestPassword,
    state,
    today,
    toggleStay,
    updateStay,
  } = useDemoPortal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingPending, setCreatingPending] = useState(false);
  const [credential, setCredential] = useState<DemoOneTimeCredential | null>(null);
  const [credentialTitle, setCredentialTitle] = useState("Credenziali create");
  const [resettingId, setResettingId] = useState<string | null>(null);

  const stays = useMemo(
    () => [...(state?.stays ?? [])].sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    [state?.stays],
  );
  const selected = stays.find((stay) => stay.id === selectedId) ?? stays[0];
  const selectedAccount = state?.accounts.find((account) => account.id === selected?.accountId);

  async function handleResetPassword(stay: DemoStay) {
    setResettingId(stay.id);
    try {
      const result = await resetGuestPassword(stay.accountId);
      setCredentialTitle(`Nuova password · ${stay.surname}`);
      setCredential(result.credential);
    } finally {
      setResettingId(null);
    }
  }

  return (
    <section aria-labelledby="stays-title" className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionHeading} id="stays-title">Soggiorni</h2>
          <p className={styles.sectionIntro}>Crea l’accesso ospite e gestisci date, camera e preferenze.</p>
        </div>
        <button className={styles.buttonPrimary} onClick={() => setCreating(true)} type="button">
          Nuovo soggiorno
        </button>
      </div>

      {stays.length && selected ? (
        <div className={styles.sectionLayout}>
          <div className={styles.listPane}>
            <ul className={styles.list}>
              {stays.map((stay) => {
                const account = state?.accounts.find((candidate) => candidate.id === stay.accountId);
                return (
                  <li key={stay.id}>
                    <button
                      aria-pressed={selected.id === stay.id}
                      className={styles.listCard}
                      onClick={() => setSelectedId(stay.id)}
                      type="button"
                    >
                      <span className={styles.cardTopline}>
                        <strong className={styles.cardTitle}>{stay.guestName}</strong>
                        <span className={stay.active ? styles.activeBadge : styles.inactiveBadge}>
                          {stay.active ? "Attivo" : "Disattivato"}
                        </span>
                      </span>
                      <span className={styles.cardMeta}>{stay.room} · {stay.guests} ospiti</span>
                      <span className={styles.cardMeta}>{formatAdminDate(stay.checkIn)} — {formatAdminDate(stay.checkOut)}</span>
                      <code className={styles.credentialCode}>{account?.loginCode ?? "Codice non disponibile"}</code>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <article className={styles.detailPanel}>
            <div className={styles.detailTopline}>
              <div>
                <span className="eyebrow">Scheda soggiorno</span>
                <h3 className={styles.detailHeading}>{selected.guestName}</h3>
              </div>
              <span className={selected.active ? styles.activeBadge : styles.inactiveBadge}>
                {selected.active ? "Attivo" : "Disattivato"}
              </span>
            </div>
            <div className={styles.inlineNotice}>
              Codice di accesso: <code className={styles.credentialCode}>{selectedAccount?.loginCode ?? "—"}</code>
            </div>
            <StayForm
              key={selected.id}
              initial={selected}
              mode="edit"
              onSubmit={(input) => updateStay(selected.id, input)}
            />
            <div className={styles.cardActions}>
              <button
                className={styles.buttonGhost}
                disabled={resettingId === selected.id}
                onClick={() => void handleResetPassword(selected)}
                type="button"
              >
                {resettingId === selected.id ? "Generazione…" : "Reimposta password"}
              </button>
              <button
                className={selected.active ? styles.buttonDanger : styles.button}
                onClick={() => toggleStay(selected.id, !selected.active)}
                type="button"
              >
                {selected.active ? "Disattiva accesso" : "Riattiva accesso"}
              </button>
            </div>
          </article>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Nessun soggiorno</strong>
          <p>Crea il primo accesso ospite per iniziare la demo.</p>
        </div>
      )}

      {creating ? (
        <AdminModal
          description="Il codice e la password vengono generati automaticamente."
          dismissible={!creatingPending}
          onClose={() => {
            if (!creatingPending) setCreating(false);
          }}
          title="Nuovo soggiorno"
        >
          <StayForm
            initial={{
              surname: "",
              guestName: "",
              checkIn: today,
              checkOut: addDemoDays(today, 3),
              room: "",
              guests: 2,
              locale: "it",
            }}
            mode="create"
            onPendingChange={setCreatingPending}
            onSubmit={async (input) => {
              const result = await createStay(input);
              setCreating(false);
              setSelectedId(result.stay.id);
              setCredentialTitle("Credenziali del nuovo soggiorno");
              setCredential(result.credential);
            }}
          />
        </AdminModal>
      ) : null}

      {credential ? (
        <CredentialModal
          loginCode={credential.loginCode}
          onClose={() => setCredential(null)}
          password={credential.password}
          title={credentialTitle}
        />
      ) : null}
    </section>
  );
}

type StayFormValues = Pick<
  DemoStay,
  "surname" | "guestName" | "checkIn" | "checkOut" | "room" | "guests" | "locale"
>;

type StayFormProps = {
  initial: StayFormValues;
  mode: "create" | "edit";
  onPendingChange?: (pending: boolean) => void;
  onSubmit: (input: StayFormValues) => void | Promise<void>;
};

function StayForm({ initial, mode, onPendingChange, onSubmit }: StayFormProps) {
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<"saved" | "error" | null>(null);

  function patch<K extends keyof StayFormValues>(key: K, value: StayFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    onPendingChange?.(true);
    setNotice(null);
    try {
      await onSubmit(values);
      setNotice("saved");
    } catch {
      setNotice("error");
    } finally {
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={`${mode}-stay-surname`}>Cognome</label>
          <input
            id={`${mode}-stay-surname`}
            maxLength={80}
            onChange={(event) => patch("surname", event.target.value)}
            required
            value={values.surname}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-stay-name`}>Nome visualizzato</label>
          <input
            id={`${mode}-stay-name`}
            maxLength={120}
            onChange={(event) => patch("guestName", event.target.value)}
            placeholder="Famiglia Rossi"
            required={mode === "edit"}
            value={values.guestName}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-stay-check-in`}>Check-in</label>
          <input
            id={`${mode}-stay-check-in`}
            onChange={(event) => patch("checkIn", event.target.value)}
            required
            type="date"
            value={values.checkIn}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-stay-check-out`}>Check-out</label>
          <input
            id={`${mode}-stay-check-out`}
            min={values.checkIn}
            onChange={(event) => patch("checkOut", event.target.value)}
            required
            type="date"
            value={values.checkOut}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-stay-room`}>Camera</label>
          <input
            id={`${mode}-stay-room`}
            maxLength={120}
            onChange={(event) => patch("room", event.target.value)}
            placeholder="Camera 3 · Terrazza mare"
            required
            value={values.room}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-stay-guests`}>Ospiti</label>
          <input
            id={`${mode}-stay-guests`}
            max={20}
            min={1}
            onChange={(event) => patch("guests", Number(event.target.value))}
            required
            type="number"
            value={values.guests}
          />
        </div>
        <div className={styles.fieldFull}>
          <label htmlFor={`${mode}-stay-locale`}>Lingua ospite</label>
          <select
            id={`${mode}-stay-locale`}
            onChange={(event) => patch("locale", event.target.value as DemoLocale)}
            value={values.locale}
          >
            {DEMO_LOCALES.map((locale) => (
              <option key={locale} value={locale}>{localeNames[locale]}</option>
            ))}
          </select>
        </div>
      </div>
      {notice === "saved" && mode === "edit" ? <div className={styles.successNotice} role="status">Soggiorno aggiornato.</div> : null}
      {notice === "error" ? <div className={styles.errorNotice} role="alert">Controlla i dati e l’intervallo delle date.</div> : null}
      <button className={styles.buttonPrimary} disabled={pending} type="submit">
        {pending ? "Salvataggio…" : mode === "create" ? "Crea accesso" : "Salva soggiorno"}
      </button>
    </form>
  );
}
