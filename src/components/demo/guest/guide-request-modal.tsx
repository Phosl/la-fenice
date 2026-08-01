"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  addDemoDays,
  type DemoGuideCatalogItem,
  type DemoLocale,
  type DemoPortalContextValue,
  type DemoStay,
} from "@/lib/demo-portal";

import { createClientRequestId } from "./format";
import type { GuideCopy } from "./guide-copy";
import styles from "./guide.module.css";

type GuideRequestModalProps = {
  copy: GuideCopy;
  createGuideRequest: DemoPortalContextValue["createGuideRequest"];
  item: DemoGuideCatalogItem;
  locale: DemoLocale;
  onClose: () => void;
  stay: DemoStay;
  today: string;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function laterDate(left: string, right: string): string {
  return left > right ? left : right;
}

export function GuideRequestModal({
  copy,
  createGuideRequest,
  item,
  locale,
  onClose,
  stay,
  today,
}: GuideRequestModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);
  const minDate = laterDate(stay.checkIn, today);
  const maxDate = addDemoDays(stay.checkOut, -1);
  const canRequest = minDate <= maxDate;
  const [requestedDate, setRequestedDate] = useState(canRequest ? minDate : "");
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [participants, setParticipants] = useState(stay.guests);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const titleId = `guide-request-${item.id}-title`;
  const descriptionId = `guide-request-${item.id}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    window.requestAnimationFrame(() => {
      if (canRequest) dateRef.current?.focus();
      else closeButtonRef.current?.focus();
    });

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [canRequest]);

  useEffect(() => {
    if (!submitted) return;
    window.requestAnimationFrame(() => doneButtonRef.current?.focus());
  }, [submitted]);

  const participantOptions = useMemo(
    () => Array.from({ length: stay.guests }, (_, index) => index + 1),
    [stay.guests],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((element) => !element.hidden);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRequest || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(false);
    try {
      requestIdRef.current ??= createClientRequestId("guest-guide");
      createGuideRequest({
        guideItemId: item.id,
        requestedDate,
        preferredTime,
        participants,
        notes,
        clientRequestId: requestIdRef.current,
      });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function markDraftChanged() {
    requestIdRef.current = null;
    setError(false);
  }

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      <div className={styles.dialogCard}>
        <button
          aria-label={copy.modal.close}
          className={styles.dialogClose}
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>

        <header className={styles.dialogHeader}>
          <span className={styles.eyebrow}>{copy.modal.eyebrow}</span>
          <h2 id={titleId}>{copy.modal.title}</h2>
          <p id={descriptionId}>
            <strong>{item.labels[locale]}</strong> · {copy.modal.lead}
          </p>
        </header>

        {submitted ? (
          <div aria-live="polite" className={styles.dialogSuccess} role="status">
            <span aria-hidden="true">✓</span>
            <p>{copy.modal.success}</p>
            <button
              className={styles.primaryButton}
              onClick={onClose}
              ref={doneButtonRef}
              type="button"
            >
              {copy.modal.done}
            </button>
          </div>
        ) : (
          <form className={styles.requestForm} onSubmit={handleSubmit}>
            {canRequest ? (
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>{copy.modal.date}</span>
                  <input
                    aria-describedby={`${titleId}-date-hint`}
                    max={maxDate}
                    min={minDate}
                    onChange={(event) => {
                      setRequestedDate(event.target.value);
                      markDraftChanged();
                    }}
                    ref={dateRef}
                    required
                    type="date"
                    value={requestedDate}
                  />
                  <small id={`${titleId}-date-hint`}>{copy.modal.dateHint}</small>
                </label>

                <label className={styles.field}>
                  <span>{copy.modal.time}</span>
                  <input
                    onChange={(event) => {
                      setPreferredTime(event.target.value);
                      markDraftChanged();
                    }}
                    required
                    type="time"
                    value={preferredTime}
                  />
                </label>

                <label className={styles.field}>
                  <span>{copy.modal.participants}</span>
                  <select
                    onChange={(event) => {
                      setParticipants(Number(event.target.value));
                      markDraftChanged();
                    }}
                    value={participants}
                  >
                    {participantOptions.map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`${styles.field} ${styles.notesField}`}>
                  <span>{copy.modal.notes}</span>
                  <textarea
                    maxLength={1000}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      markDraftChanged();
                    }}
                    placeholder={copy.modal.notesPlaceholder}
                    rows={4}
                    value={notes}
                  />
                </label>
              </div>
            ) : (
              <p className={styles.unavailableNotice}>{copy.modal.unavailable}</p>
            )}

            <p className={styles.nonBinding}>{copy.modal.nonBinding}</p>
            {error ? (
              <p aria-live="assertive" className={styles.formError} role="alert">
                {copy.modal.error}
              </p>
            ) : null}

            <div className={styles.dialogActions}>
              <button className={styles.secondaryButton} onClick={onClose} type="button">
                {copy.modal.cancel}
              </button>
              {canRequest ? (
                <button className={styles.primaryButton} disabled={submitting} type="submit">
                  {submitting ? copy.modal.submitting : copy.modal.submit}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
