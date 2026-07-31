import { englishContent } from "./en";
import { italianContent } from "./it";
import type { Locale, RouteKey, SiteContent } from "./types";

export const siteContent = {
  en: englishContent,
  it: italianContent,
} as const satisfies Record<Locale, SiteContent>;

export const getContent = (locale: Locale): SiteContent => siteContent[locale];

export const getPageContent = (locale: Locale, route: RouteKey) =>
  getContent(locale).pages[route];

export { englishContent } from "./en";
export { italianContent } from "./it";
export { media } from "./media";
export * from "./navigation";
export * from "./routes";
export { siteIdentity } from "./site";
export * from "./types";
