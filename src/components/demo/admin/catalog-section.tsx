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

export function CatalogSection() {
  const { saveCatalogItem, state, toggleCatalogItem } = useDemoPortal();
  const [kindFilter, setKindFilter] = useState<"all" | DemoCatalogItem["kind"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState<DemoCatalogItem["kind"] | null>(null);

  const catalog = useMemo(
    () => [...(state?.catalog ?? [])]
      .filter((item) => kindFilter === "all" || item.kind === kindFilter)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [kindFilter, state?.catalog],
  );
  const selected = catalog.find((item) => item.id === selectedId) ?? catalog[0];

  return (
    <section aria-labelledby="catalog-title" className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionHeading} id="catalog-title">Catalogo</h2>
          <p className={styles.sectionIntro}>Prodotti e attività disponibili nell’area ospite.</p>
        </div>
        <div className={styles.dashboardActions}>
          <button className={styles.buttonPrimary} onClick={() => setCreating("product")} type="button">
            Nuovo prodotto
          </button>
          <button className={styles.button} onClick={() => setCreating("activity")} type="button">
            Nuova attività
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label htmlFor="catalog-kind-filter">Visualizza</label>
          <select
            className={styles.filterSelect}
            id="catalog-kind-filter"
            onChange={(event) => {
              setKindFilter(event.target.value as typeof kindFilter);
              setSelectedId(null);
            }}
            value={kindFilter}
          >
            <option value="all">Tutto il catalogo</option>
            <option value="product">Prodotti</option>
            <option value="activity">Attività</option>
          </select>
        </div>
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
                      <span className={styles.requestKind}>{item.kind === "product" ? "Prodotto" : "Attività"}</span>
                      <span className={item.active ? styles.activeBadge : styles.inactiveBadge}>
                        {item.active ? "Attivo" : "Nascosto"}
                      </span>
                    </span>
                    <span className={styles.cardTitleRow}>
                      <strong className={styles.cardTitle}>{item.labels.it}</strong>
                      <span className={styles.price}>{formatPrice(item.priceCents)}</span>
                    </span>
                    <span className={styles.cardMeta}>{categoryLabel(item)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <article className={styles.detailPanel}>
            <div className={styles.detailTopline}>
              <div>
                <span className="eyebrow">{selected.kind === "product" ? "Prodotto" : "Attività"}</span>
                <h3 className={styles.detailHeading}>{selected.labels.it}</h3>
              </div>
              <span className={selected.active ? styles.activeBadge : styles.inactiveBadge}>
                {selected.active ? "Attivo" : "Nascosto"}
              </span>
            </div>
            <CatalogForm
              initial={selected}
              key={selected.id}
              onSubmit={(input) => {
                saveCatalogItem(input);
              }}
            />
            <button
              className={selected.active ? styles.buttonDanger : styles.button}
              onClick={() => toggleCatalogItem(selected.id, !selected.active)}
              type="button"
            >
              {selected.active ? "Nascondi dal catalogo" : "Riattiva nel catalogo"}
            </button>
          </article>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Nessun elemento</strong>
          <p>Aggiungi un prodotto o un’attività al catalogo demo.</p>
        </div>
      )}

      {creating ? (
        <AdminModal
          description="Inserisci il nome in tutte le lingue disponibili."
          onClose={() => setCreating(null)}
          title={creating === "product" ? "Nuovo prodotto" : "Nuova attività"}
        >
          <CatalogForm
            initial={{
              kind: creating,
              category: creating === "product" ? "food" : "other",
              labels: { en: "", it: "", de: "", ru: "" },
              active: true,
            }}
            onSubmit={(input) => {
              const item = saveCatalogItem(input);
              setCreating(null);
              setKindFilter("all");
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
  onSubmit: (input: DemoCatalogItemInput) => void;
};

function CatalogForm({ initial, onSubmit }: CatalogFormProps) {
  const [kind, setKind] = useState(initial.kind);
  const [category, setCategory] = useState(initial.category);
  const [labels, setLabels] = useState(initial.labels);
  const [price, setPrice] = useState(
    initial.priceCents === undefined ? "" : (initial.priceCents / 100).toFixed(2),
  );
  const [active, setActive] = useState(initial.active);
  const [notice, setNotice] = useState<"saved" | "error" | null>(null);
  const categories = kind === "product" ? productCategories : activityCategories;

  function changeKind(nextKind: DemoCatalogItem["kind"]) {
    setKind(nextKind);
    setCategory(nextKind === "product" ? "food" : "other");
    setNotice(null);
  }

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
        kind,
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
          <label htmlFor={`catalog-kind-${initial.id ?? "new"}`}>Tipo</label>
          <select
            id={`catalog-kind-${initial.id ?? "new"}`}
            onChange={(event) => changeKind(event.target.value as DemoCatalogItem["kind"])}
            value={kind}
          >
            <option value="product">Prodotto</option>
            <option value="activity">Attività</option>
          </select>
        </div>
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
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Nomi tradotti</legend>
        <div className={styles.localeGrid}>
          {(["it", "en", "de", "ru"] as const).map((locale) => (
            <div className={styles.field} key={locale}>
              <label htmlFor={`catalog-${locale}-${initial.id ?? "new"}`}>{locale.toUpperCase()}</label>
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

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={`catalog-price-${initial.id ?? "new"}`}>Prezzo EUR (opzionale)</label>
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
        <label className={styles.switchField}>
          <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
          <span>Disponibile agli ospiti</span>
        </label>
      </div>

      {notice === "saved" && initial.id ? <div className={styles.successNotice} role="status">Elemento aggiornato.</div> : null}
      {notice === "error" ? <div className={styles.errorNotice} role="alert">Controlla categoria, traduzioni e prezzo.</div> : null}
      <button className={styles.buttonPrimary} type="submit">
        {initial.id ? "Salva elemento" : "Aggiungi al catalogo"}
      </button>
    </form>
  );
}
