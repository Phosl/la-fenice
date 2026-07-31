import type { MetadataRoute } from "next";

import { getLocalizedPath, routeKeys } from "../lib/content/routes";
import { getAbsoluteUrl } from "../lib/site-url";

type SitemapEntry = MetadataRoute.Sitemap[number];

const indexableRouteKeys = routeKeys.filter(
  (routeKey) => routeKey !== "privacy" && routeKey !== "terms",
);

function getPageSettings(
  pathname: string,
): Pick<SitemapEntry, "changeFrequency" | "priority"> {
  if (pathname === "/" || pathname === "/it") {
    return { changeFrequency: "monthly", priority: 1 };
  }

  if (
    pathname.endsWith("/rooms") ||
    pathname.endsWith("/camere") ||
    pathname.endsWith("/availability") ||
    pathname.endsWith("/disponibilita")
  ) {
    return { changeFrequency: "monthly", priority: 0.9 };
  }

  return { changeFrequency: "monthly", priority: 0.8 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRouteKeys.flatMap((routeKey) => {
    const englishPath = getLocalizedPath(routeKey, "en");
    const italianPath = getLocalizedPath(routeKey, "it");
    const languages = {
      en: getAbsoluteUrl(englishPath),
      it: getAbsoluteUrl(italianPath),
      "x-default": getAbsoluteUrl(englishPath),
    };

    return [englishPath, italianPath].map((pathname) => ({
      url: getAbsoluteUrl(pathname),
      alternates: { languages },
      ...getPageSettings(pathname),
    }));
  });
}
