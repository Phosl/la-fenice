"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "./admin.module.css";

type ModalProps = {
  children: ReactNode;
  description?: string;
  dismissible?: boolean;
  onClose: () => void;
  title: string;
};

export function AdminModal({
  children,
  description,
  dismissible = true,
  onClose,
  title,
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  }, [dismissible, onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissibleRef.current) onCloseRef.current();
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <div
      aria-describedby={description ? "admin-modal-description" : undefined}
      aria-labelledby="admin-modal-title"
      aria-modal="true"
      className={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalHeading} id="admin-modal-title">{title}</h2>
            {description ? (
              <p className={styles.muted} id="admin-modal-description">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Chiudi finestra"
            className={styles.iconButton}
            disabled={!dismissible}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <CloseGlyph />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type CredentialModalProps = {
  loginCode: string;
  onClose: () => void;
  password: string;
  title: string;
};

export function CredentialModal({ loginCode, onClose, password, title }: CredentialModalProps) {
  const credential = `${loginCode} / ${password}`;

  return (
    <AdminModal
      description="La password viene mostrata una sola volta. Copiala prima di chiudere."
      onClose={onClose}
      title={title}
    >
      <div className={styles.form}>
        <div aria-live="polite" className={styles.passwordReveal}>
          <span>Codice soggiorno</span>
          <strong>{loginCode}</strong>
          <span>Password temporanea</span>
          <strong>{password}</strong>
          <p>Queste credenziali sono simulate e funzionano soltanto in questo browser.</p>
        </div>
        <div className={styles.formActions}>
          <button
            className={styles.buttonPrimary}
            onClick={() => void navigator.clipboard?.writeText(credential)}
            type="button"
          >
            Copia credenziali
          </button>
          <button className={styles.buttonGhost} onClick={onClose} type="button">
            Ho copiato, chiudi
          </button>
        </div>
      </div>
    </AdminModal>
  );
}

type ConfirmModalProps = {
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
  title: string;
};

export function ConfirmModal({
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  pending = false,
  title,
}: ConfirmModalProps) {
  return (
    <AdminModal
      description={description}
      dismissible={!pending}
      onClose={onCancel}
      title={title}
    >
      <div className={styles.formActions}>
        <button className={styles.buttonDanger} disabled={pending} onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
        <button className={styles.buttonGhost} disabled={pending} onClick={onCancel} type="button">
          Annulla
        </button>
      </div>
    </AdminModal>
  );
}

export function CloseGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function formatAdminDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatAdminDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(date);
}

export function formatPrice(priceCents: number | null | undefined) {
  if (priceCents == null) return "Su richiesta";
  return new Intl.NumberFormat("it-IT", {
    currency: "EUR",
    style: "currency",
  }).format(priceCents / 100);
}
