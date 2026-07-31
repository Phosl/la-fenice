import type { MetadataRoute } from "next";

import {
  getLanguageAlternates,
  getLocalizedPath,
  routeKeys,
  supportedLocales,
} from "../lib/content/routes";
import type { RouteKey } from "../lib/content/types";
import { getAbsoluteUrl } from "../lib/site-url";

type SitemapEntry = MetadataRoute.Sitemap[number];

const indexableRouteKeys = routeKeys.filter(
  (routeKey) => routeKey !== "privacy" && routeKey !== "terms",
);

function getPageSettings(
  routeKey: RouteKey,
): Pick<SitemapEntry, "changeFrequency" | "priority"> {
  if (routeKey === "home") {
    return { changeFrequency: "monthly", priority: 1 };
  }

  if (routeKey === "rooms" || routeKey === "availability") {
    return { changeFrequency: "monthly", priority: 0.9 };
  }

  return { changeFrequency: "monthly", priority: 0.8 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRouteKeys.flatMap((routeKey) => {
    const languages = Object.fromEntries(
      Object.entries(getLanguageAlternates(routeKey)).map(
        ([locale, pathname]) => [locale, getAbsoluteUrl(pathname)],
      ),
    );

    return supportedLocales.map((locale) => {
      const pathname = getLocalizedPath(routeKey, locale);

      return {
        url: getAbsoluteUrl(pathname),
        alternates: { languages },
        ...getPageSettings(routeKey),
      };
    });
  });
}
