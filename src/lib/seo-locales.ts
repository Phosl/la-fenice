import type { Locale } from "@/lib/content/types";

export const languageTags = {
  en: "en-GB",
  it: "it-IT",
  de: "de-DE",
  ru: "ru-RU",
} as const satisfies Record<Locale, string>;

export const openGraphLocales = {
  en: "en_GB",
  it: "it_IT",
  de: "de_DE",
  ru: "ru_RU",
} as const satisfies Record<Locale, string>;
