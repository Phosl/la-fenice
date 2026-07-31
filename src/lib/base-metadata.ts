import type { Metadata } from "next";
import type { Locale } from "@/lib/content/types";

export function buildBaseMetadata(locale: Locale): Metadata {
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lafenicepositano.com"),
    title: {
      default:
        locale === "it"
          ? "La Fenice Positano | Un rifugio tra l'orto e il mare"
          : "La Fenice Positano | A private hillside by the sea",
      template: "%s | La Fenice Positano",
    },
    description:
      locale === "it"
        ? "Un'autentica dimora a conduzione familiare a Positano, con camere vista mare, piscina, giardini e spiaggia privata."
        : "An authentic family-run stay in Positano with sea-view rooms, a seawater pool, gardens and a private beach.",
    manifest: "/site.webmanifest",
    icons: {
      icon: "/favicon.svg",
      apple: "/favicon.svg",
    },
  };
}
