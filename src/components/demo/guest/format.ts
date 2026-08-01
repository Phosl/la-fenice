import type { DemoLocale } from "@/lib/demo-portal";

const intlLocales: Record<DemoLocale, string> = {
  en: "en-GB",
  it: "it-IT",
  de: "de-DE",
  ru: "ru-RU",
};

function plainDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function formatGuestDate(
  value: string,
  locale: DemoLocale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    ...options,
    timeZone: "UTC",
  }).format(plainDate(value));
}

export function formatGuestPrice(priceCents: number, locale: DemoLocale): string {
  return new Intl.NumberFormat(intlLocales[locale], {
    currency: "EUR",
    style: "currency",
  }).format(priceCents / 100);
}

export function countStayNights(checkIn: string, checkOut: string): number {
  const milliseconds = plainDate(checkOut).getTime() - plainDate(checkIn).getTime();
  return Math.max(0, Math.round(milliseconds / 86_400_000));
}

export function createClientRequestId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}
