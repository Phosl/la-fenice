"use client";

import { type FormEvent, useState } from "react";

import {
  type DemoGuideCatalogItemInput,
  type DemoGuideCategory,
  type DemoLocalizedLabel,
} from "@/lib/demo-portal";

import styles from "./admin.module.css";

export const guideCategories: Array<{ value: DemoGuideCategory; label: string }> = [
  { value: "dining", label: "A tavola" },
  { value: "after-dark", label: "Dopo il tramonto" },
  { value: "sea", label: "Al mare" },
  { value: "see", label: "Da vedere" },
  { value: "getting-around", label: "Muoversi" },
  { value: "essentials", label: "Informazioni utili" },
];

const localeLabels = {
  de: "Deutsch",
  en: "English",
  it: "Italiano",
  ru: "Русский",
} as const;

export const emptyLocalized = (): DemoLocalizedLabel => ({
  de: "",
  en: "",
  it: "",
  ru: "",
});

type GuideCatalogInput = DemoGuideCatalogItemInput;

type GuideFormProps = {
  initial: GuideCatalogInput;
  onSubmit: (input: GuideCatalogInput) => void;
};

export function GuideForm({ initial, onSubmit }: GuideFormProps) {
  const [category, setCategory] = useState<DemoGuideCategory>(initial.category);
  const [labels, setLabels] = useState(initial.labels);
  const [description, setDescription] = useState(initial.description ?? emptyLocalized());
  const [bookingNote, setBookingNote] = useState(initial.bookingNote ?? emptyLocalized());
  const [address, setAddress] = useState(initial.address ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl ?? "");
  const [mapsUrl, setMapsUrl] = useState(initial.mapsUrl ?? "");
  const [verifiedAt, setVerifiedAt] = useState(initial.verifiedAt);
  const [requestable, setRequestable] = useState(initial.requestable);
  const [active, setActive] = useState(initial.active ?? true);
  const [notice, setNotice] = useState<"saved" | "error" | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const hasBookingNote = Object.values(bookingNote).some((value) => value.trim());
    try {
      onSubmit({
        id: initial.id,
        kind: "guide",
        category,
        labels,
        description,
        bookingNote: hasBookingNote ? bookingNote : undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        mapsUrl: mapsUrl.trim() || undefined,
        requestable,
        verifiedAt,
        active,
        sortOrder: initial.sortOrder,
      });
      setNotice("saved");
    } catch {
      setNotice("error");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={`guide-category-${initial.id ?? "new"}`}>Categoria</label>
          <select
            id={`guide-category-${initial.id ?? "new"}`}
            onChange={(event) => setCategory(event.target.value as DemoGuideCategory)}
            value={category}
          >
            {guideCategories.map((choice) => (
              <option key={choice.value} value={choice.value}>{choice.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`guide-verified-${initial.id ?? "new"}`}>Verificato il</label>
          <input
            id={`guide-verified-${initial.id ?? "new"}`}
            onChange={(event) => setVerifiedAt(event.target.value)}
            required
            type="date"
            value={verifiedAt}
          />
        </div>
        <div className={styles.fieldFull}>
          <label htmlFor={`guide-address-${initial.id ?? "new"}`}>Indirizzo</label>
          <input
            id={`guide-address-${initial.id ?? "new"}`}
            maxLength={180}
            onChange={(event) => setAddress(event.target.value)}
            value={address}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`guide-phone-${initial.id ?? "new"}`}>Telefono</label>
          <input
            id={`guide-phone-${initial.id ?? "new"}`}
            maxLength={40}
            onChange={(event) => setPhone(event.target.value)}
            value={phone}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`guide-website-${initial.id ?? "new"}`}>Sito ufficiale</label>
          <input
            id={`guide-website-${initial.id ?? "new"}`}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://"
            type="url"
            value={websiteUrl}
          />
        </div>
        <div className={styles.fieldFull}>
          <label htmlFor={`guide-maps-${initial.id ?? "new"}`}>Google Maps</label>
          <input
            id={`guide-maps-${initial.id ?? "new"}`}
            onChange={(event) => setMapsUrl(event.target.value)}
            placeholder="https://www.google.com/maps/…"
            type="url"
            value={mapsUrl}
          />
        </div>
      </div>

      <GuideLocalizedFields
        id={initial.id ?? "new"}
        legend="Nome mostrato agli ospiti"
        maxLength={120}
        onChange={setLabels}
        required
        values={labels}
      />
      <GuideLocalizedFields
        id={`${initial.id ?? "new"}-description`}
        legend="Descrizione breve"
        maxLength={600}
        multiline
        onChange={setDescription}
        required
        values={description}
      />
      <GuideLocalizedFields
        id={`${initial.id ?? "new"}-booking`}
        legend="Nota pratica o di prenotazione (facoltativa)"
        maxLength={300}
        multiline
        onChange={setBookingNote}
        values={bookingNote}
      />

      <div className={styles.guideSwitches}>
        <label className={styles.switchField}>
          <input
            checked={requestable}
            onChange={(event) => setRequestable(event.target.checked)}
            type="checkbox"
          />
          <span>Consenti richiesta non vincolante allo staff</span>
        </label>
        <label className={styles.switchField}>
          <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
          <span>Visibile nell’area ospite</span>
        </label>
      </div>

      {notice === "saved" && initial.id ? (
        <div className={styles.successNotice} role="status">Luogo aggiornato.</div>
      ) : null}
      {notice === "error" ? (
        <div className={styles.errorNotice} role="alert">
          Controlla traduzioni, data e collegamenti: sono accettati soltanto URL http o https.
        </div>
      ) : null}
      <button className={styles.buttonPrimary} type="submit">
        {initial.id ? "Salva luogo" : "Aggiungi alla guida"}
      </button>
    </form>
  );
}
type GuideLocalizedFieldsProps = {
  id: string;
  legend: string;
  maxLength: number;
  multiline?: boolean;
  onChange: (value: DemoLocalizedLabel) => void;
  required?: boolean;
  values: DemoLocalizedLabel;
};

function GuideLocalizedFields({
  id,
  legend,
  maxLength,
  multiline = false,
  onChange,
  required = false,
  values,
}: GuideLocalizedFieldsProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{legend}</legend>
      <div className={styles.localeGrid}>
        {(["it", "en", "de", "ru"] as const).map((locale) => {
          const fieldId = `guide-${id}-${locale}`;
          return (
            <div className={styles.field} key={locale}>
              <label htmlFor={fieldId}>{localeLabels[locale]}</label>
              {multiline ? (
                <textarea
                  id={fieldId}
                  maxLength={maxLength}
                  onChange={(event) => onChange({ ...values, [locale]: event.target.value })}
                  required={required}
                  value={values[locale]}
                />
              ) : (
                <input
                  id={fieldId}
                  maxLength={maxLength}
                  onChange={(event) => onChange({ ...values, [locale]: event.target.value })}
                  required={required}
                  value={values[locale]}
                />
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
