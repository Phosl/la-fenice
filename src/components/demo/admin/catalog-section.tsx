"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  type DemoActivityCategory,
  type DemoCatalogItem,
  type DemoCatalogItemInput,
  type DemoProductCategory,
  useDemoPortal,
} from "@/lib/demo-portal";
import { AdminModal, formatPrice } from "./admin-ui";
import styles from "./admin.module.css";

const productCategories: Array<{ value: DemoProductCategory; label: string }> = [
  { value: "food", label: "Cibo" },
  { value: "classic-drink", label: "Bevanda classica" },
  { value: "wine", label: "Vino" },
  { value: "champagne", label: "Champagne" },
  { value: "raw-fish", label: "Crudo di pesce" },
];

const activityCategories: Array<{ value: DemoActivityCategory; label: string }> = [
  { value: "fishing", label: "Pesca" },
  { value: "boat-trip", label: "Giro in barca" },
  { value: "lemon-grove", label: "Limonaia" },
  { value: "other", label: "Altra attività" },
];

type CatalogSectionProps = {
  kind: DemoCatalogItem["kind"];
};

const sectionCopy = {
  product: {
    add: "Aggiungi prodotto",
    empty: "Aggiungi il primo prodotto disponibile per gli ospiti.",
    emptyTitle: "Shop vuoto",
    intro: "Cibi e bevande ordinabili durante il soggiorno.",
    modalTitle: "Nuovo prodotto",
    plural: "prodotti visibili",
    reactivate: "Mostra nello Shop",
    submitCreate: "Aggiungi allo Shop",
    submitEdit: "Salva prodotto",
    title: "Shop",
    toggleOff: "Nascondi dallo Shop",
    visibility: "Visibile nello Shop",
  },
  activity: {
    add: "Aggiungi attività",
    empty: "Aggiungi la prima esperienza prenotabile dagli ospiti.",
    emptyTitle: "Nessuna attività",
    intro: "Esperienze che gli ospiti possono richiedere dal calendario.",
    modalTitle: "Nuova attività",
    plural: "attività visibili",
    reactivate: "Mostra agli ospiti",
    submitCreate: "Aggiungi attività",
    submitEdit: "Salva attività",
    title: "Attività",
    toggleOff: "Nascondi agli ospiti",
    visibility: "Disponibile agli ospiti",
  },
} as const;

const localeLabels = {
  de: "Deutsch",
  en: "English",
  it: "Italiano",
  ru: "Русский",
} as const;

export function CatalogSection({ kind }: CatalogSectionProps) {
  const { saveCatalogItem, state, toggleCatalogItem } = useDemoPortal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const copy = sectionCopy[kind];

  const catalog = useMemo(
    () => [...(state?.catalog ?? [])]
      .filter((item) => item.kind === kind)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [kind, state?.catalog],
  );
  const selected = catalog.find((item) => item.id === selectedId) ?? catalog[0];
  const activeCount = catalog.filter((item) => item.active).length;

  return (
    <section aria-labelledby={`${kind}-catalog-title`} className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.headingWithMeta}>
            <h2 className={styles.sectionHeading} id={`${kind}-catalog-title`}>{copy.title}</h2>
            <span className={styles.sectionMeta}>{activeCount} {copy.plural}</span>
          </div>
          <p className={styles.sectionIntro}>{copy.intro}</p>
        </div>
        <button className={styles.buttonPrimary} onClick={() => setCreating(true)} type="button">
          {copy.add}
        </button>
      </div>

      {catalog.length && selected ? (
        <div className={styles.sectionLayout}>
          <div className={styles.listPane}>
            <ul className={styles.list}>
              {catalog.map((item) => (
                <li key={item.id}>
                  <button
                    aria-pressed={selected.id === item.id}
                    className={styles.listCard}
                    onClick={() => setSelectedId(item.id)}
                    type="button"
                  >
                    <span className={styles.cardTopline}>
                      <span className={styles.requestKind}>{categoryLabel(item)}</span>
                      <span className={item.active ? styles.activeBadge : styles.inactiveBadge}>
                        {item.active ? "Attivo" : "Nascosto"}
                      </span>
                    </span>
                    <span className={styles.cardTitleRow}>
                      <strong className={styles.cardTitle}>{item.labels.it}</strong>
                      <span className={styles.price}>{formatPrice(item.priceCents)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <article className={styles.detailPanel}>
            <div className={styles.detailTopline}>
              <div>
                <span className="eyebrow">{categoryLabel(selected)}</span>
                <h3 className={styles.detailHeading}>{selected.labels.it}</h3>
              </div>
              <span className={selected.active ? styles.activeBadge : styles.inactiveBadge}>
                {selected.active ? "Attivo" : "Nascosto"}
              </span>
            </div>
            <CatalogForm
              initial={selected}
              key={selected.id}
              labels={copy}
              onSubmit={(input) => {
                saveCatalogItem(input);
              }}
            />
            <button
              className={selected.active ? styles.buttonDanger : styles.button}
              onClick={() => toggleCatalogItem(selected.id, !selected.active)}
              type="button"
            >
              {selected.active ? copy.toggleOff : copy.reactivate}
            </button>
          </article>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>{copy.emptyTitle}</strong>
          <p>{copy.empty}</p>
        </div>
      )}

      {creating ? (
        <AdminModal
          description="Inserisci il nome per le quattro lingue dell’area ospite."
          onClose={() => setCreating(false)}
          title={copy.modalTitle}
        >
          <CatalogForm
            initial={{
              kind,
              category: kind === "product" ? "food" : "other",
              labels: { en: "", it: "", de: "", ru: "" },
              active: true,
            }}
            labels={copy}
            onSubmit={(input) => {
              const item = saveCatalogItem(input);
              setCreating(false);
              setSelectedId(item.id);
            }}
          />
        </AdminModal>
      ) : null}
    </section>
  );
}

function categoryLabel(item: DemoCatalogItem) {
  const choices = item.kind === "product" ? productCategories : activityCategories;
  return choices.find((choice) => choice.value === item.category)?.label ?? item.category;
}

type CatalogFormInitial = Pick<DemoCatalogItemInput, "kind" | "category" | "labels"> & {
  id?: string;
  active: boolean;
  priceCents?: number;
  sortOrder?: number;
};

type CatalogFormProps = {
  initial: CatalogFormInitial;
  labels: (typeof sectionCopy)[DemoCatalogItem["kind"]];
  onSubmit: (input: DemoCatalogItemInput) => void;
};

function CatalogForm({ initial, labels: copy, onSubmit }: CatalogFormProps) {
  const [category, setCategory] = useState(initial.category);
  const [labels, setLabels] = useState(initial.labels);
  const [price, setPrice] = useState(
    initial.priceCents === undefined ? "" : (initial.priceCents / 100).toFixed(2),
  );
  const [active, setActive] = useState(initial.active);
  const [notice, setNotice] = useState<"saved" | "error" | null>(null);
  const categories = initial.kind === "product" ? productCategories : activityCategories;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = price.trim() === "" ? undefined : Math.round(Number(price.replace(",", ".")) * 100);
    if (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setNotice("error");
      return;
    }

    try {
      onSubmit({
        id: initial.id,
        kind: initial.kind,
        category,
        labels,
        priceCents: parsedPrice,
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
          <label htmlFor={`catalog-category-${initial.id ?? "new"}`}>Categoria</label>
          <select
            id={`catalog-category-${initial.id ?? "new"}`}
            onChange={(event) => setCategory(event.target.value as DemoCatalogItemInput["category"])}
            value={category}
          >
            {categories.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`catalog-price-${initial.id ?? "new"}`}>Prezzo (€)</label>
          <input
            id={`catalog-price-${initial.id ?? "new"}`}
            inputMode="decimal"
            min="0"
            onChange={(event) => {
              setPrice(event.target.value);
              setNotice(null);
            }}
            placeholder="Su richiesta"
            step="0.01"
            type="number"
            value={price}
          />
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Nome mostrato agli ospiti</legend>
        <div className={styles.localeGrid}>
          {(["it", "en", "de", "ru"] as const).map((locale) => (
            <div className={styles.field} key={locale}>
              <label htmlFor={`catalog-${locale}-${initial.id ?? "new"}`}>
                {localeLabels[locale]}
              </label>
              <input
                id={`catalog-${locale}-${initial.id ?? "new"}`}
                maxLength={120}
                onChange={(event) => {
                  setLabels((current) => ({ ...current, [locale]: event.target.value }));
                  setNotice(null);
                }}
                required
                value={labels[locale]}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <label className={styles.switchField}>
        <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
        <span>{copy.visibility}</span>
      </label>

      {notice === "saved" && initial.id ? <div className={styles.successNotice} role="status">Elemento aggiornato.</div> : null}
      {notice === "error" ? <div className={styles.errorNotice} role="alert">Controlla categoria, traduzioni e prezzo.</div> : null}
      <button className={styles.buttonPrimary} type="submit">
        {initial.id ? copy.submitEdit : copy.submitCreate}
      </button>
    </form>
  );
}
