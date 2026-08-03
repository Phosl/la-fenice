import type { Metadata } from "next";
import { brandLogo } from "@/lib/brand-assets";
import { getContent } from "@/lib/content";
import { siteIdentity } from "@/lib/content/site";
import type { Locale } from "@/lib/content/types";
import { getSiteUrl } from "@/lib/site-url";

export function buildBaseMetadata(locale: Locale): Metadata {
  const homeMetadata = getContent(locale).pages.home.metadata;

  return {
    metadataBase: getSiteUrl(),
    applicationName: siteIdentity.name,
    creator: siteIdentity.name,
    publisher: siteIdentity.name,
    title: {
      default: homeMetadata.title,
      template: "%s | La Fenice Positano",
    },
    description: homeMetadata.description,
    manifest: "/site.webmanifest",
    icons: {
      icon: brandLogo.blueSrc,
      apple: brandLogo.blueSrc,
    },
  };
}
