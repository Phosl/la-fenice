import { getRouteKeyFromSlug, routeKeys, routeSlugs } from "./routes";
import type { Locale, RouteKey } from "./types";

export type ContentRouteKey = Exclude<RouteKey, "home">;

export const contentRouteKeys = routeKeys.filter(
  (route): route is ContentRouteKey => route !== "home",
);

export function getContentRouteFromSlug(
  locale: Locale,
  slug: string,
): ContentRouteKey | null {
  const route = getRouteKeyFromSlug(locale, slug);
  return route && route !== "home" ? route : null;
}

export function getLocalizedStaticParams(locale: Locale) {
  return contentRouteKeys.map((route) => ({ slug: routeSlugs[locale][route] }));
}
