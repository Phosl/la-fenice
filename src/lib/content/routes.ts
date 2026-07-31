import type { Locale, RouteKey } from "./types";

export const supportedLocales = [
  "en",
  "it",
  "de",
  "ru",
] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "en";

export const routeKeys = [
  "home",
  "rooms",
  "pool",
  "privateBeach",
  "gardenTable",
  "location",
  "gettingHere",
  "availability",
  "privacy",
  "terms",
] as const satisfies readonly RouteKey[];

export const routeSlugs: Record<Locale, Record<RouteKey, string>> = {
  en: {
    home: "",
    rooms: "rooms",
    pool: "pool",
    privateBeach: "private-beach",
    gardenTable: "garden-table",
    location: "location",
    gettingHere: "getting-here",
    availability: "availability",
    privacy: "privacy",
    terms: "terms",
  },
  it: {
    home: "",
    rooms: "camere",
    pool: "piscina",
    privateBeach: "spiaggia-privata",
    gardenTable: "orto-e-sapori",
    location: "posizione",
    gettingHere: "come-arrivare",
    availability: "disponibilita",
    privacy: "privacy",
    terms: "condizioni",
  },
  de: {
    home: "",
    rooms: "zimmer",
    pool: "pool",
    privateBeach: "privatstrand",
    gardenTable: "garten-und-genuss",
    location: "lage",
    gettingHere: "anreise",
    availability: "verfuegbarkeit",
    privacy: "datenschutz",
    terms: "bedingungen",
  },
  ru: {
    home: "",
    rooms: "nomera",
    pool: "basseyn",
    privateBeach: "chastnyy-plyazh",
    gardenTable: "sad-i-vkusy",
    location: "raspolozhenie",
    gettingHere: "kak-dobratsya",
    availability: "zapros-nalichiya",
    privacy: "konfidentsialnost",
    terms: "usloviya",
  },
};

const normalizePathname = (pathname: string): string => {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, "")
    : withLeadingSlash;
};

export const isLocale = (value: string): value is Locale =>
  supportedLocales.some((locale) => locale === value);

export const getLocalizedPath = (route: RouteKey, locale: Locale): string => {
  const slug = routeSlugs[locale][route];

  if (locale === defaultLocale) {
    return slug ? `/${slug}` : "/";
  }

  return slug ? `/${locale}/${slug}` : `/${locale}`;
};

export const getLocaleFromPath = (pathname: string): Locale => {
  const normalized = normalizePathname(pathname);
  const firstSegment = normalized.split("/")[1];

  return isLocale(firstSegment) && firstSegment !== defaultLocale
    ? firstSegment
    : defaultLocale;
};

export const getRouteKeyFromPath = (pathname: string): RouteKey | null => {
  const normalized = normalizePathname(pathname);

  for (const locale of supportedLocales) {
    for (const route of routeKeys) {
      if (getLocalizedPath(route, locale) === normalized) {
        return route;
      }
    }
  }

  return null;
};

export const getRouteKeyFromSlug = (
  locale: Locale,
  slug: string,
): RouteKey | null =>
  routeKeys.find((route) => routeSlugs[locale][route] === slug) ?? null;

export const switchLocalePath = (
  pathname: string,
  targetLocale: Locale,
): string => {
  const route = getRouteKeyFromPath(pathname);
  return getLocalizedPath(route ?? "home", targetLocale);
};

export const getLanguageAlternates = (
  route: RouteKey,
): Record<Locale | "x-default", string> => ({
  en: getLocalizedPath(route, "en"),
  it: getLocalizedPath(route, "it"),
  de: getLocalizedPath(route, "de"),
  ru: getLocalizedPath(route, "ru"),
  "x-default": getLocalizedPath(route, defaultLocale),
});

export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent: true;
}

export const legacyRedirects = [
  {
    source: "/index.php",
    destination: getLocalizedPath("home", "en"),
    permanent: true,
  },
  {
    source: "/rooms-with-sea-view-positano.php",
    destination: getLocalizedPath("rooms", "en"),
    permanent: true,
  },
  {
    source: "/private-swimming-pool-positano.php",
    destination: getLocalizedPath("pool", "en"),
    permanent: true,
  },
  {
    source: "/private-beach-positano.php",
    destination: getLocalizedPath("privateBeach", "en"),
    permanent: true,
  },
  {
    source: "/typical-specialities-positano.php",
    destination: getLocalizedPath("gardenTable", "en"),
    permanent: true,
  },
  {
    source: "/where-we-are.php",
    destination: getLocalizedPath("location", "en"),
    permanent: true,
  },
  {
    source: "/how_to_arrive_in_positano.php",
    destination: getLocalizedPath("gettingHere", "en"),
    permanent: true,
  },
  {
    source: "/availability-request.php",
    destination: getLocalizedPath("availability", "en"),
    permanent: true,
  },
  {
    source: "/privacy-policy.php",
    destination: getLocalizedPath("privacy", "en"),
    permanent: true,
  },
  {
    source: "/terms-and-conditions.php",
    destination: getLocalizedPath("terms", "en"),
    permanent: true,
  },
] as const satisfies readonly LegacyRedirect[];
