import { getLocalizedPath } from "@/lib/content/routes";
import { siteIdentity } from "@/lib/content/site";
import type { SiteContent } from "@/lib/content/types";
import { languageTags } from "@/lib/seo-locales";
import { getAbsoluteUrl } from "@/lib/site-url";
import { JsonLd, type JsonLdValue } from "./json-ld";

export function buildHomeStructuredData(content: SiteContent): JsonLdValue {
  const page = content.pages.home;
  const websiteUrl = getAbsoluteUrl("/");
  const localizedPageUrl = getAbsoluteUrl(
    getLocalizedPath("home", content.locale),
  );
  const websiteId = `${websiteUrl}#website`;
  const lodgingId = `${websiteUrl}#lodging`;
  const webpageId = `${localizedPageUrl}#webpage`;
  const image = {
    "@type": "ImageObject",
    url: getAbsoluteUrl(page.hero.image.src),
    width: page.hero.image.width,
    height: page.hero.image.height,
    caption: page.hero.image.alt,
  } as const;

  const lodging = {
    "@type": "BedAndBreakfast",
    "@id": lodgingId,
    name: siteIdentity.name,
    url: websiteUrl,
    description: page.metadata.description,
    email: siteIdentity.email,
    telephone: siteIdentity.phone.href.replace("tel:", ""),
    logo: getAbsoluteUrl("/logo-la-fenice.svg"),
    image,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteIdentity.address.street,
      postalCode: siteIdentity.address.postalCode,
      addressLocality: siteIdentity.address.locality,
      addressRegion: siteIdentity.address.region,
      addressCountry: siteIdentity.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteIdentity.coordinates.latitude,
      longitude: siteIdentity.coordinates.longitude,
    },
    hasMap: siteIdentity.maps.place,
    sameAs: siteIdentity.social.map((item) => item.href),
    mainEntityOfPage: { "@id": webpageId },
  } as const;

  const webpage = {
    "@type": "WebPage",
    "@id": webpageId,
    url: localizedPageUrl,
    name: page.metadata.title,
    description: page.metadata.description,
    inLanguage: languageTags[content.locale],
    isPartOf: { "@id": websiteId },
    about: { "@id": lodgingId },
    primaryImageOfPage: image,
  } as const;

  const graph: JsonLdValue[] = [lodging, webpage];

  if (content.locale === "en") {
    graph.unshift({
      "@type": "WebSite",
      "@id": websiteId,
      url: websiteUrl,
      name: siteIdentity.name,
      alternateName: "La Fenice",
      inLanguage: Object.values(languageTags),
      publisher: { "@id": lodgingId },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function HomeStructuredData({ content }: { content: SiteContent }) {
  return (
    <JsonLd
      data={buildHomeStructuredData(content)}
      id="la-fenice-structured-data"
    />
  );
}
