"use client";

import { type KeyboardEvent, useMemo, useState } from "react";

import {
  isStayDateOrderable,
  listStayCalendarDates,
  type DemoActivityCatalogItem,
  type DemoDate,
  type DemoProductCatalogItem,
} from "@/lib/demo-portal";

import { ActivityPanel } from "./activity-panel";
import { guestDemoCopy } from "./copy";
import { countStayNights, formatGuestDate } from "./format";
import { GuestLanguageSelect } from "./guest-language-select";
import styles from "./guest.module.css";
import { RequestsList } from "./requests-list";
import { ShopPanel } from "./shop-panel";
import { StayCalendar } from "./stay-calendar";
import { useGuestPortalAccess } from "./use-guest-portal-access";

type PlannerTab = "shop" | "activity";

export function GuestStay() {
  const {
    authenticated,
    cancelActivityRequest,
    cancelOrder,
    createActivityRequest,
    createOrder,
    currentStay,
    setGuestLocale,
    state,
    today,
  } = useGuestPortalAccess();
  const [selectedDate, setSelectedDate] = useState<DemoDate>(today);
  const [activeTab, setActiveTab] = useState<PlannerTab>("shop");

  const calendarDates = useMemo(
    () => (currentStay ? listStayCalendarDates(currentStay) : []),
    [currentStay],
  );

  if (!authenticated || !currentStay || !state) {
    return (
      <div aria-live="polite" className={styles.loadingCard} role="status">
        {guestDemoCopy.it.loading}
      </div>
    );
  }

  const locale = currentStay.locale;
  const copy = guestDemoCopy[locale];
  const firstSelectableDate = calendarDates.find((date) => date !== currentStay.checkOut);
  const effectiveSelectedDate =
    selectedDate !== currentStay.checkOut && calendarDates.includes(selectedDate)
      ? selectedDate
      : calendarDates.includes(today) && today !== currentStay.checkOut
        ? today
        : (firstSelectableDate ?? currentStay.checkIn);
  const orderable = isStayDateOrderable(currentStay, effectiveSelectedDate, today);
  const isCheckout = effectiveSelectedDate === currentStay.checkOut;
  const products = state.catalog
    .filter(
      (item): item is DemoProductCatalogItem => item.kind === "product" && item.active,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const activities = state.catalog
    .filter(
      (item): item is DemoActivityCatalogItem => item.kind === "activity" && item.active,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const orders = state.orders.filter(
    (order) => order.stayId === currentStay.id && order.serviceDate === effectiveSelectedDate,
  );
  const activityRequests = state.activityRequests.filter(
    (request) =>
      request.stayId === currentStay.id && request.requestedDate === effectiveSelectedDate,
  );
  const nights = countStayNights(currentStay.checkIn, currentStay.checkOut);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab: PlannerTab = activeTab === "shop" ? "activity" : "shop";
    setActiveTab(nextTab);
    document.getElementById(`guest-${nextTab}-tab`)?.focus();
  }

  return (
    <section className={styles.stayPage} lang={locale}>
      <header className={styles.stayHero}>
        <div className={styles.stayHeroMain}>
          <div className={styles.heroTopline}>
            <span className={styles.eyebrow}>{copy.stay.eyebrow}</span>
            <GuestLanguageSelect
              className={styles.stayLanguage}
              locale={locale}
              onChange={setGuestLocale}
            />
          </div>
          <h1 className={styles.stayTitle}>
            {copy.stay.welcome}, {currentStay.guestName}
          </h1>
          <p className={styles.stayLead}>{copy.stay.lead}</p>
        </div>

        <dl className={styles.stayFacts}>
          <div>
            <dt>{copy.stay.room}</dt>
            <dd>{currentStay.room}</dd>
          </div>
          <div>
            <dt>{copy.stay.guests}</dt>
            <dd>{currentStay.guests}</dd>
          </div>
          <div>
            <dt>{copy.stay.checkIn}</dt>
            <dd>{formatGuestDate(currentStay.checkIn, locale)}</dd>
          </div>
          <div>
            <dt>{copy.stay.checkOut}</dt>
            <dd>{formatGuestDate(currentStay.checkOut, locale)}</dd>
          </div>
          <div>
            <dt>{nights === 1 ? copy.stay.night : copy.stay.nights}</dt>
            <dd>{nights}</dd>
          </div>
        </dl>
      </header>

      <StayCalendar
        copy={copy}
        dates={calendarDates}
        locale={locale}
        onSelect={setSelectedDate}
        selectedDate={effectiveSelectedDate}
        stay={currentStay}
        today={today}
      />

      <section aria-labelledby="guest-planner-title" className={styles.planner}>
        <div className={styles.plannerHeader}>
          <div>
            <h2 className={styles.panelTitle} id="guest-planner-title">
              {copy.day.title} · {formatGuestDate(effectiveSelectedDate, locale, {
                day: "numeric",
                month: "long",
                weekday: "long",
              })}
            </h2>
          </div>
          {orderable ? (
            <div aria-label={copy.day.title} className={styles.tabs} role="tablist">
              <button
                aria-controls="guest-shop-panel"
                aria-selected={activeTab === "shop"}
                className={styles.tab}
                id="guest-shop-tab"
                onClick={() => setActiveTab("shop")}
                onKeyDown={handleTabKeyDown}
                role="tab"
                tabIndex={activeTab === "shop" ? 0 : -1}
                type="button"
              >
                {copy.day.orderTab}
              </button>
              <button
                aria-controls="guest-activity-panel"
                aria-selected={activeTab === "activity"}
                className={styles.tab}
                id="guest-activity-tab"
                onClick={() => setActiveTab("activity")}
                onKeyDown={handleTabKeyDown}
                role="tab"
                tabIndex={activeTab === "activity" ? 0 : -1}
                type="button"
              >
                {copy.day.activityTab}
              </button>
            </div>
          ) : null}
        </div>

        {orderable ? (
          <>
            <div
              aria-labelledby="guest-shop-tab"
              className={styles.tabPanel}
              hidden={activeTab !== "shop"}
              id="guest-shop-panel"
              role="tabpanel"
            >
              <ShopPanel
                copy={copy}
                createOrder={createOrder}
                key={`shop-${effectiveSelectedDate}`}
                locale={locale}
                products={products}
                selectedDate={effectiveSelectedDate}
              />
            </div>
            <div
              aria-labelledby="guest-activity-tab"
              className={styles.tabPanel}
              hidden={activeTab !== "activity"}
              id="guest-activity-panel"
              role="tabpanel"
            >
              <ActivityPanel
                activities={activities}
                copy={copy}
                createActivityRequest={createActivityRequest}
                guestCount={currentStay.guests}
                key={`activity-${effectiveSelectedDate}`}
                locale={locale}
                selectedDate={effectiveSelectedDate}
              />
            </div>
          </>
        ) : (
          <div className={styles.readOnlyNotice}>
            <strong>{copy.day.readOnlyTitle}</strong><br />
            {isCheckout ? copy.day.readOnlyCheckout : copy.day.readOnlyPast}
          </div>
        )}
      </section>

      <RequestsList
        activityRequests={activityRequests}
        cancelActivityRequest={cancelActivityRequest}
        cancelOrder={cancelOrder}
        copy={copy}
        locale={locale}
        orders={orders}
      />
    </section>
  );
}
