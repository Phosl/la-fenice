"use client";

import { useMemo, useState } from "react";

import {
  type DemoCatalogItemInput,
  type DemoGuideCatalogItem,
  type DemoGuideCategory,
  useDemoPortal,
} from "@/lib/demo-portal";

import { AdminModal } from "./admin-ui";
import { emptyLocalized, GuideForm, guideCategories } from "./guide-form";
import styles from "./admin.module.css";

type GuideCatalogInput = Extract<DemoCatalogItemInput, { kind: "guide" }>;

function categoryLabel(category: DemoGuideCategory) {
  return guideCategories.find((choice) => choice.value === category)?.label ?? category;
}

function itemToInput(
  item: DemoGuideCatalogItem,
  patch: Partial<GuideCatalogInput> = {},
): GuideCatalogInput {
  return {
    id: item.id,
    kind: "guide",
    category: item.category,
    labels: item.labels,
    description: item.description,
    bookingNote: item.bookingNote,
    address: item.address,
    phone: item.phone,
    websiteUrl: item.websiteUrl,
    mapsUrl: item.mapsUrl,
    requestable: item.requestable,
    verifiedAt: item.verifiedAt,
    active: item.active,
    sortOrder: item.sortOrder,
    ...patch,
  };
}

export function GuideSection() {
  const { saveCatalogItem, state, toggleCatalogItem } = useDemoPortal();
  const [categoryFilter, setCategoryFilter] = useState<"all" | DemoGuideCategory>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "active" | "hidden">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionNotice, setActionNotice] = useState<"saved" | "error" | null>(null);

  const allItems = useMemo(
    () =>
      (state?.catalog ?? [])
        .filter((item): item is DemoGuideCatalogItem => item.kind === "guide")
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [state?.catalog],
  );
  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("it");
    return allItems.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (visibilityFilter === "active" && !item.active) return false;
      if (visibilityFilter === "hidden" && item.active) return false;
      if (!normalizedQuery) return true;
      return [item.labels.it, item.address ?? "", item.description?.it ?? ""]
        .join(" ")
        .toLocaleLowerCase("it")
        .includes(normalizedQuery);
    });
  }, [allItems, categoryFilter, query, visibilityFilter]);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const activeCount = allItems.filter((item) => item.active).length;

  function moveItem(item: DemoGuideCatalogItem, direction: -1 | 1) {
    const index = allItems.findIndex((candidate) => candidate.id === item.id);
    const neighbour = allItems[index + direction];
    if (!neighbour) return;
    setActionNotice(null);
    try {
      saveCatalogItem(itemToInput(neighbour, { sortOrder: item.sortOrder }));
      saveCatalogItem(itemToInput(item, { sortOrder: neighbour.sortOrder }));
      setActionNotice("saved");
    } catch {
      setActionNotice("error");
    }
  }

  return (
    <section aria-labelledby="guide-catalog-title" className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.headingWithMeta}>
            <h2 className={styles.sectionHeading} id="guide-catalog-title">Guida</h2>
            <span className={styles.sectionMeta}>{activeCount} luoghi visibili</span>
          </div>
          <p className={styles.sectionIntro}>
            Indirizzi scelti per gli ospiti, con contatti ufficiali e testi nelle quattro lingue.
          </p>
        </div>
        <button className={styles.buttonPrimary} onClick={() => setCreating(true)} type="button">
          Aggiungi luogo
        </button>
      </div>

      <div aria-label="Filtri guida" className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label htmlFor="guide-admin-search">Cerca</label>
          <input
            className={styles.filterSelect}
            id="guide-admin-search"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
            }}
            placeholder="Nome, descrizione o indirizzo"
            type="search"
            value={query}
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="guide-admin-category">Categoria</label>
          <select
            className={styles.filterSelect}
            id="guide-admin-category"
            onChange={(event) => {
              setCategoryFilter(event.target.value as typeof categoryFilter);
              setSelectedId(null);
            }}
            value={categoryFilter}
          >
            <option value="all">Tutte</option>
            {guideCategories.map((choice) => (
              <option key={choice.value} value={choice.value}>{choice.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="guide-admin-visibility">Visibilità</label>
          <select
            className={styles.filterSelect}
            id="guide-admin-visibility"
            onChange={(event) => {
              setVisibilityFilter(event.target.value as typeof visibilityFilter);
              setSelectedId(null);
            }}
            value={visibilityFilter}
          >
            <option value="all">Tutti</option>
            <option value="active">Visibili</option>
            <option value="hidden">Archiviati</option>
          </select>
        </div>
      </div>

      {items.length && selected ? (
        <div className={styles.sectionLayout}>
          <div className={styles.listPane}>
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    aria-pressed={selected.id === item.id}
                    className={styles.listCard}
                    onClick={() => {
                      setSelectedId(item.id);
                      setActionNotice(null);
                    }}
                    type="button"
                  >
                    <span className={styles.cardTopline}>
                      <span className={styles.requestKind}>{categoryLabel(item.category)}</span>
                      <span className={item.active ? styles.activeBadge : styles.inactiveBadge}>
                        {item.active ? "Visibile" : "Archiviato"}
                      </span>
                    </span>
                    <strong className={styles.cardTitle}>{item.labels.it}</strong>
                    <span className={styles.cardMeta}>{item.address || "Indirizzo non indicato"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <article className={styles.detailPanel}>
            <div className={styles.detailTopline}>
              <div>
                <span className="eyebrow">{categoryLabel(selected.category)}</span>
                <h3 className={styles.detailHeading}>{selected.labels.it}</h3>
              </div>
              <span className={selected.active ? styles.activeBadge : styles.inactiveBadge}>
                {selected.active ? "Visibile" : "Archiviato"}
              </span>
            </div>

            <div className={styles.guideAdminActions}>
              <button
                className={styles.button}
                disabled={allItems[0]?.id === selected.id}
                onClick={() => moveItem(selected, -1)}
                type="button"
              >
                Sposta su
              </button>
              <button
                className={styles.button}
                disabled={allItems.at(-1)?.id === selected.id}
                onClick={() => moveItem(selected, 1)}
                type="button"
              >
                Sposta giù
              </button>
              {selected.websiteUrl ? (
                <a className={styles.buttonGhost} href={selected.websiteUrl} rel="noreferrer" target="_blank">
                  Apri fonte
                </a>
              ) : null}
              {selected.mapsUrl ? (
                <a className={styles.buttonGhost} href={selected.mapsUrl} rel="noreferrer" target="_blank">
                  Apri Maps
                </a>
              ) : null}
            </div>

            {actionNotice === "saved" ? (
              <div className={styles.successNotice} role="status">Ordine aggiornato.</div>
            ) : null}
            {actionNotice === "error" ? (
              <div className={styles.errorNotice} role="alert">Non è stato possibile riordinare la guida.</div>
            ) : null}

            <GuideForm
              initial={selected}
              key={selected.id}
              onSubmit={(input) => saveCatalogItem(input)}
            />
            <button
              className={selected.active ? styles.buttonDanger : styles.button}
              onClick={() => toggleCatalogItem(selected.id, !selected.active)}
              type="button"
            >
              {selected.active ? "Archivia luogo" : "Ripristina luogo"}
            </button>
          </article>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Nessun luogo trovato</strong>
          <p>Modifica i filtri oppure aggiungi un nuovo indirizzo alla guida.</p>
        </div>
      )}

      {creating ? (
        <AdminModal
          description="Inserisci testi brevi e verificati in tutte le lingue dell’area ospite."
          onClose={() => setCreating(false)}
          title="Nuovo luogo"
        >
          <GuideForm
            initial={{
              kind: "guide",
              category: "dining",
              labels: emptyLocalized(),
              description: emptyLocalized(),
              bookingNote: undefined,
              address: "",
              phone: "",
              websiteUrl: "",
              mapsUrl: "",
              requestable: false,
              verifiedAt: new Date().toISOString().slice(0, 10),
              active: true,
            }}
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
