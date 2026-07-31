import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import type { Locale } from "@/lib/content/types";

export function buildBaseMetadata(locale: Locale): Metadata {
  const homeMetadata = getContent(locale).pages.home.metadata;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lafenicepositano.com",
    ),
    title: {
      default: homeMetadata.title,
      template: "%s | La Fenice Positano",
    },
    description: homeMetadata.description,
    manifest: "/site.webmanifest",
    icons: {
      icon: "/logo-la-fenice.svg",
      apple: "/logo-la-fenice.svg",
    },
  };
}
