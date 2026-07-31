import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/site-url";
import { getContent } from "@/lib/content";
import { getLanguageAlternates, getLocalizedPath } from "@/lib/content/routes";
import type { Locale, RouteKey } from "@/lib/content/types";

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
      languages: {
        en: paths.en,
        it: paths.it,
        "x-default": paths.en,
      },
    },
    robots:
      metadata.robots === "noindex"
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: locale === "it" ? "it_IT" : "en_GB",
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
