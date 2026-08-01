import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/site-url";
import { getContent } from "@/lib/content";
import { getLanguageAlternates, getLocalizedPath } from "@/lib/content/routes";
import type { Locale, RouteKey } from "@/lib/content/types";
import { openGraphLocales } from "@/lib/seo-locales";

export function buildMetadata(locale: Locale, route: RouteKey): Metadata {
  const page = getContent(locale).pages[route];
  const metadata = page.metadata;
  const paths = getLanguageAlternates(route);
  const canonicalPath = getLocalizedPath(route, locale);

  return {
    title: { absolute: metadata.title },
    description: metadata.description,
    alternates: {
      canonical: canonicalPath,
      languages: paths,
    },
    robots:
      metadata.robots === "noindex"
        ? { index: false, follow: true }
        : {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large",
              "max-snippet": -1,
              "max-video-preview": -1,
            },
          },
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
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: metadata.openGraphImage
        ? [
            {
              url: getAbsoluteUrl(metadata.openGraphImage.src),
              alt: metadata.openGraphImage.alt,
            },
          ]
        : undefined,
    },
  };
}
