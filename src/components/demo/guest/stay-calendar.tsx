"use client";

import { useRef } from "react";

import type { DemoDate, DemoLocale, DemoStay } from "@/lib/demo-portal";

import type { GuestCopy } from "./copy";
import { formatGuestDate } from "./format";
import styles from "./guest.module.css";

type StayCalendarProps = {
  copy: GuestCopy;
  dates: DemoDate[];
  locale: DemoLocale;
  onSelect: (date: DemoDate) => void;
  selectedDate: DemoDate;
  stay: DemoStay;
  today: DemoDate;
};

export function StayCalendar({
  copy,
  dates,
  locale,
  onSelect,
  selectedDate,
  stay,
  today,
}: StayCalendarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollCalendar(direction: -1 | 1) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollerRef.current?.scrollBy({
      behavior: reduceMotion ? "auto" : "smooth",
      left: direction * 340,
    });
  }

  return (
    <section aria-labelledby="guest-calendar-title" className={styles.calendarSection}>
      <div className={styles.sectionHeading}>
        <div>
          <h2 className={styles.sectionTitle} id="guest-calendar-title">
            {copy.calendar.title}
          </h2>
          <p className={styles.sectionLead}>{copy.calendar.lead}</p>
        </div>
        <div className={styles.calendarControls}>
          <button
            aria-label={copy.calendar.previous}
            className={styles.roundButton}
            onClick={() => scrollCalendar(-1)}
            type="button"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            aria-label={copy.calendar.next}
            className={styles.roundButton}
            onClick={() => scrollCalendar(1)}
            type="button"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className={styles.calendarScroller} ref={scrollerRef}>
        {dates.map((date) => {
          const isToday = date === today;
          const isPast = date < today;
          const isCheckIn = date === stay.checkIn;
          const isCheckOut = date === stay.checkOut;
          const isSelected = date === selectedDate;
          const badges = [
            isToday ? copy.calendar.today : "",
            isCheckIn ? copy.calendar.checkIn : "",
            isCheckOut ? copy.calendar.checkOut : "",
            isPast && !isToday ? copy.calendar.past : "",
          ].filter(Boolean);
          const longDate = formatGuestDate(date, locale, {
            day: "numeric",
            month: "long",
            weekday: "long",
            year: "numeric",
          });

          return (
            <button
              aria-current={isToday ? "date" : undefined}
              aria-label={`${longDate}${badges.length ? ` — ${badges.join(", ")}` : ""}`}
              aria-pressed={isSelected}
              className={styles.dayButton}
              data-disabled={isCheckOut}
              data-selected={isSelected}
              data-today={isToday}
              disabled={isCheckOut}
              key={date}
              onClick={() => onSelect(date)}
              type="button"
            >
              <span className={styles.dayWeekday}>
                {formatGuestDate(date, locale, { weekday: "short" })}
              </span>
              <span className={styles.dayNumber}>
                {formatGuestDate(date, locale, { day: "2-digit" })}
              </span>
              <span className={styles.dayMonth}>
                {formatGuestDate(date, locale, { month: "short" })}
              </span>
              {badges.length ? <span className={styles.dayBadge}>{badges.join(" · ")}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
