"use client";

import { useMemo, useState } from "react";

import {
  DEMO_GUIDE_CATEGORIES,
  type DemoGuideCatalogItem,
  type DemoGuideCategory,
} from "@/lib/demo-portal";

import { guideCopy } from "./guide-copy";
import { GuestLanguageSelect } from "./guest-language-select";
import { GuideRequestModal } from "./guide-request-modal";
import { GuideRequests } from "./guide-requests";
import { useGuestPortalAccess } from "./use-guest-portal-access";
import styles from "./guide.module.css";

type GuideFilter = DemoGuideCategory | "all";

function normaliseSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

export function PositanoGuide() {
  const {
    authenticated,
    cancelGuideRequest,
    createGuideRequest,
    currentStay,
    setGuestLocale,
    state,
    today,
  } = useGuestPortalAccess();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GuideFilter>("all");
  const [selectedItem, setSelectedItem] = useState<DemoGuideCatalogItem | null>(null);

  const items = useMemo(
    () =>
      state?.catalog
        .filter(
          (item): item is DemoGuideCatalogItem => item.kind === "guide" && item.active,
        )
        .sort((left, right) => left.sortOrder - right.sortOrder) ?? [],
    [state?.catalog],
  );

  if (!authenticated || !currentStay || !state) {
    return (
      <div aria-live="polite" className={styles.loadingCard} role="status">
        {guideCopy.it.loading}
      </div>
    );
  }

  const locale = currentStay.locale;
  const copy = guideCopy[locale];
  const normalisedQuery = normaliseSearch(query);
  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (!normalisedQuery) return true;
    const searchableText = [
      item.labels[locale],
      item.description?.[locale],
      item.address,
      item.bookingNote?.[locale],
      copy.filters.categories[item.category],
    ]
      .filter(Boolean)
      .join(" ");
    return normaliseSearch(searchableText).includes(normalisedQuery);
  });
  const requests = state.guideRequests.filter(
    (request) => request.stayId === currentStay.id,
  );

  return (
    <section className={styles.guidePage} lang={locale}>
      <header className={styles.guideHero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{copy.intro.eyebrow}</span>
          <h1>{copy.intro.title}</h1>
          <p>{copy.intro.lead}</p>
        </div>

        <GuestLanguageSelect
          className={styles.languageField}
          locale={locale}
          onChange={setGuestLocale}
        />
      </header>

      <section aria-labelledby="guide-places-title" className={styles.placesSection}>
        <h2 className={styles.visuallyHidden} id="guide-places-title">
          {copy.intro.title}
        </h2>

        <div className={styles.guideTools}>
          <label className={styles.searchField}>
            <span>{copy.search.label}</span>
            <span className={styles.searchInputWrap}>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search.placeholder}
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label={copy.search.clear}
                  className={styles.clearSearch}
                  onClick={() => setQuery("")}
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </span>
          </label>

          <div
            aria-label={copy.filters.label}
            className={styles.filters}
            role="group"
          >
            <button
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              type="button"
            >
              {copy.filters.all}
            </button>
            {DEMO_GUIDE_CATEGORIES.map((category) => (
              <button
                aria-pressed={filter === category}
                key={category}
                onClick={() => setFilter(category)}
                type="button"
              >
                {copy.filters.categories[category]}
              </button>
            ))}
          </div>
        </div>

        <p aria-live="polite" className={styles.resultCount} role="status">
          {filteredItems.length} {filteredItems.length === 1 ? copy.results.single : copy.results.many}
        </p>

        {filteredItems.length ? (
          <div className={styles.placeGrid}>
            {filteredItems.map((item) => (
              <article className={styles.placeCard} key={item.id}>
                <div className={styles.cardTopline}>
                  <span>{copy.filters.categories[item.category]}</span>
                </div>
                <h3>{item.labels[locale]}</h3>
                {item.description ? <p className={styles.description}>{item.description[locale]}</p> : null}

                {item.address ? (
                  <p className={styles.address}>
                    <strong>{copy.card.address}</strong>
                    <span>{item.address}</span>
                  </p>
                ) : null}

                {item.bookingNote ? (
                  <aside className={styles.bookingNote}>
                    <strong>{copy.card.booking}</strong>
                    <p>{item.bookingNote[locale]}</p>
                  </aside>
                ) : null}

                <div className={styles.cardActions}>
                  {item.websiteUrl ? (
                    <a href={item.websiteUrl} rel="noreferrer" target="_blank">
                      {copy.card.officialSite} <ExternalArrow />
                    </a>
                  ) : null}
                  {item.mapsUrl ? (
                    <a href={item.mapsUrl} rel="noreferrer" target="_blank">
                      {copy.card.maps} <ExternalArrow />
                    </a>
                  ) : null}
                  {item.phone ? (
                    <a href={`tel:${item.phone.replace(/\s/g, "")}`}>
                      {copy.card.phone}
                    </a>
                  ) : null}
                </div>

                {item.requestable ? (
                  <button
                    className={styles.requestButton}
                    onClick={() => setSelectedItem(item)}
                    type="button"
                  >
                    {copy.card.request}
                    <span aria-hidden="true">→</span>
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>{copy.results.emptyTitle}</h3>
            <p>{copy.results.emptyText}</p>
          </div>
        )}
      </section>

      <aside className={styles.seasonalNote}>
        <span aria-hidden="true">≈</span>
        <div>
          <h2>{copy.seasonal.title}</h2>
          <p>{copy.seasonal.text}</p>
        </div>
      </aside>

      <section aria-labelledby="before-you-go-title" className={styles.beforeYouGo}>
        <header className={styles.sectionHeading}>
          <span className={styles.eyebrow}>{copy.beforeYouGo.eyebrow}</span>
          <h2 id="before-you-go-title">{copy.beforeYouGo.title}</h2>
          <p>{copy.beforeYouGo.lead}</p>
        </header>

        <div className={styles.beforeGrid}>
          <article>
            <span aria-hidden="true">01</span>
            <h3>{copy.beforeYouGo.verticalityTitle}</h3>
            <p>{copy.beforeYouGo.verticalityText}</p>
          </article>
          <article>
            <span aria-hidden="true">02</span>
            <h3>{copy.beforeYouGo.weatherTitle}</h3>
            <p>{copy.beforeYouGo.weatherText}</p>
          </article>
          <article>
            <span aria-hidden="true">03</span>
            <h3>{copy.beforeYouGo.transportTitle}</h3>
            <p>{copy.beforeYouGo.transportText}</p>
          </article>
          <article>
            <span aria-hidden="true">04</span>
            <h3>{copy.beforeYouGo.assistanceTitle}</h3>
            <p>{copy.beforeYouGo.assistanceText}</p>
          </article>
        </div>

        <a
          className={styles.comuneLink}
          href="https://comune.positano.sa.it/servizi/servizi-sanitari"
          rel="noreferrer"
          target="_blank"
        >
          {copy.beforeYouGo.comuneLink} <ExternalArrow />
        </a>
      </section>

      <GuideRequests
        cancelGuideRequest={cancelGuideRequest}
        copy={copy}
        locale={locale}
        requests={requests}
      />

      {selectedItem ? (
        <GuideRequestModal
          copy={copy}
          createGuideRequest={createGuideRequest}
          item={selectedItem}
          locale={locale}
          onClose={() => setSelectedItem(null)}
          stay={currentStay}
          today={today}
        />
      ) : null}
    </section>
  );
}
