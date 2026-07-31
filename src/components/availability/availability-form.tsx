"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitAvailabilityAction, type AvailabilityActionState } from "@/app/actions/availability";
import { ArrowIcon } from "@/components/ui/icons";
import { getLocalizedPath } from "@/lib/content/routes";
import { siteIdentity } from "@/lib/content/site";
import type { AvailabilityPageContent, Locale } from "@/lib/content/types";

const initialState: AvailabilityActionState = { status: "idle" };

type AvailabilityFormProps = {
  locale: Locale;
  page: AvailabilityPageContent;
};

function localizedIssue(
  field: string,
  rawIssue: string | undefined,
  page: AvailabilityPageContent,
): string | undefined {
  if (!rawIssue) return undefined;
  if (field === "email") return page.form.validation.invalidEmail;
  if (field === "guests") return page.form.validation.invalidGuests;
  if (field === "checkOut" && rawIssue.toLowerCase().includes("after")) {
    return page.form.validation.invalidDateRange;
  }
  if (field === "consent") return page.form.validation.consentRequired;
  return page.form.validation.required;
}

export function AvailabilityForm({ locale, page }: AvailabilityFormProps) {
  const [state, action, pending] = useActionState(submitAvailabilityAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const issue = (field: string) => localizedIssue(field, state.issues?.[field as keyof typeof state.issues], page);
  const mailtoBody = encodeURIComponent(
    locale === "it"
      ? "Nome:\nTelefono:\nOspiti:\nArrivo:\nPartenza:\nRichiesta:"
      : "Name:\nPhone:\nGuests:\nCheck-in:\nCheck-out:\nRequest:",
  );
  const mailtoSubject = encodeURIComponent(locale === "it" ? "Richiesta disponibilità" : "Availability request");

  return (
    <div className="availability-layout">
      <aside className="availability-info">
        <span className="eyebrow">La Fenice</span>
        <h2 className="section-title">{page.form.title}</h2>
        <p className="lead">{page.responseTimeNote}</p>
        <div className="availability-info__contact">
          <a href={`mailto:${siteIdentity.email}`}>{siteIdentity.email}</a>
          <a href={siteIdentity.phone.href}>{siteIdentity.phone.display}</a>
        </div>
      </aside>

      <form action={action} className="availability-form" noValidate ref={formRef}>
        <input name="locale" type="hidden" value={locale} />
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
        </div>

        <p>{page.form.requiredHint}</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">{page.form.fields.name.label}</label>
            <input
              aria-describedby={issue("name") ? "name-error" : undefined}
              aria-invalid={Boolean(issue("name"))}
              autoComplete="name"
              id="name"
              maxLength={120}
              name="name"
              placeholder={page.form.fields.name.placeholder}
              required
              type="text"
            />
            {issue("name") ? <span className="field-error" id="name-error">{issue("name")}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="email">{page.form.fields.email.label}</label>
            <input
              aria-describedby={issue("email") ? "email-error" : undefined}
              aria-invalid={Boolean(issue("email"))}
              autoComplete="email"
              id="email"
              maxLength={254}
              name="email"
              placeholder={page.form.fields.email.placeholder}
              required
              type="email"
            />
            {issue("email") ? <span className="field-error" id="email-error">{issue("email")}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="phone">{page.form.fields.phone.label}</label>
            <input
              autoComplete="tel"
              id="phone"
              maxLength={40}
              name="phone"
              placeholder={page.form.fields.phone.placeholder}
              type="tel"
            />
          </div>

          <div className="field">
            <label htmlFor="guests">{page.form.fields.guests.label}</label>
            <input
              aria-describedby={issue("guests") ? "guests-error" : undefined}
              aria-invalid={Boolean(issue("guests"))}
              id="guests"
              max={20}
              min={1}
              name="guests"
              required
              type="number"
            />
            {issue("guests") ? <span className="field-error" id="guests-error">{issue("guests")}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="checkIn">{page.form.fields.checkIn.label}</label>
            <input
              aria-describedby={issue("checkIn") ? "check-in-error" : undefined}
              aria-invalid={Boolean(issue("checkIn"))}
              id="checkIn"
              name="checkIn"
              required
              type="date"
            />
            {issue("checkIn") ? <span className="field-error" id="check-in-error">{issue("checkIn")}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="checkOut">{page.form.fields.checkOut.label}</label>
            <input
              aria-describedby={issue("checkOut") ? "check-out-error" : undefined}
              aria-invalid={Boolean(issue("checkOut"))}
              id="checkOut"
              name="checkOut"
              required
              type="date"
            />
            {issue("checkOut") ? <span className="field-error" id="check-out-error">{issue("checkOut")}</span> : null}
          </div>

          <div className="field field--full">
            <label htmlFor="message">{page.form.fields.message.label}</label>
            <textarea
              id="message"
              maxLength={2000}
              name="message"
              placeholder={page.form.fields.message.placeholder}
            />
          </div>
        </div>

        <label className="consent-field">
          <input name="consent" required type="checkbox" value="true" />
          <span>
            {page.form.consent.prefix}{" "}
            <Link href={getLocalizedPath("privacy", locale)}>{page.form.consent.linkLabel}</Link>{" "}
            {page.form.consent.suffix}
          </span>
        </label>
        {issue("consent") ? <span className="field-error">{issue("consent")}</span> : null}

        {state.status === "success" ? (
          <div aria-live="polite" className="form-status" data-status="success" role="status">
            <strong>{page.form.successTitle}</strong><br />
            {page.form.successMessage}
          </div>
        ) : null}
        {state.status === "error" ? (
          <div aria-live="assertive" className="form-status" data-status="error" role="alert">
            <strong>{page.form.errorTitle}</strong><br />
            {state.message ?? page.form.errorMessage}{" "}
            <a href={`mailto:${siteIdentity.email}?subject=${mailtoSubject}&body=${mailtoBody}`}>
              {page.fallback.emailLabel}
            </a>
          </div>
        ) : null}

        <div className="form-actions">
          <span>{page.fallback.text}</span>
          <button className="button-primary" disabled={pending} type="submit">
            {pending ? page.form.submittingLabel : page.form.submitLabel}
            <ArrowIcon />
          </button>
        </div>
      </form>
    </div>
  );
}
