import type { DemoDate, DemoStay } from "./types";
import { DemoPortalError } from "./types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDemoDate(value: string): value is DemoDate {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function getRomeToday(now = new Date()): DemoDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${value.year}-${value.month}-${value.day}`;
}

export function addDemoDays(date: DemoDate, amount: number): DemoDate {
  if (!isDemoDate(date) || !Number.isInteger(amount)) {
    throw new DemoPortalError("invalid_date", "Invalid calendar date.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + amount));

  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function assertValidStayRange(checkIn: DemoDate, checkOut: DemoDate): void {
  if (!isDemoDate(checkIn) || !isDemoDate(checkOut) || checkOut <= checkIn) {
    throw new DemoPortalError(
      "invalid_stay",
      "Check-out must be after a valid check-in date.",
    );
  }
  if (checkOut > addDemoDays(checkIn, 60)) {
    throw new DemoPortalError(
      "invalid_stay",
      "A demo stay cannot be longer than 60 nights.",
    );
  }
}

export function isDateWithinStay(
  stay: Pick<DemoStay, "checkIn" | "checkOut">,
  date: DemoDate,
): boolean {
  return isDemoDate(date) && date >= stay.checkIn && date < stay.checkOut;
}

export function isStayDateOrderable(
  stay: Pick<DemoStay, "checkIn" | "checkOut" | "active">,
  date: DemoDate,
  today: DemoDate,
): boolean {
  return stay.active && isDateWithinStay(stay, date) && date >= today;
}

export function listStayCalendarDates(
  stay: Pick<DemoStay, "checkIn" | "checkOut">,
): DemoDate[] {
  assertValidStayRange(stay.checkIn, stay.checkOut);
  const dates: DemoDate[] = [];
  let cursor = stay.checkIn;

  while (cursor <= stay.checkOut) {
    dates.push(cursor);
    cursor = addDemoDays(cursor, 1);
  }

  return dates;
}
