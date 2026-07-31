import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/site-url";
import { getContent } from "@/lib/content";
import { getLanguageAlternates, getLocalizedPath } from "@/lib/content/routes";
import type { Locale, RouteKey } from "@/lib/content/types";

const openGraphLocales = {
  en: "en_GB",
  it: "it_IT",
  de: "de_DE",
  ru: "ru_RU",
} as const satisfies Record<Locale, string>;

export function buildMetadata(locale: Locale, route: RouteKey): Metadata {
  const page = getContent(locale).pages[route];
  const metadata = page.metadata;
  const paths = getLanguageAlternates(route);
  const canonicalPath = getLocalizedPath(route, locale);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: canonicalPath,
      languages: paths,
    },
    robots:
      metadata.robots === "noindex"
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: openGraphLocales[locale],
      alternateLocale: Object.entries(openGraphLocales)
        .filter(([candidate]) => candidate !== locale)
        .map(([, openGraphLocale]) => openGraphLocale),
      title: metadata.title,
      description: metadata.description,
      url: getAbsoluteUrl(canonicalPath),
      siteName: "La Fenice Positano",
      images: metadata.openGraphImage
        ? [
            {
              url: getAbsoluteUrl(metadata.openGraphImage.src),
              width: metadata.openGraphImage.width,
              height: metadata.openGraphImage.height,
              alt: metadata.openGraphImage.alt,
            },
          ]
        : undefined,
    },
  };
}
