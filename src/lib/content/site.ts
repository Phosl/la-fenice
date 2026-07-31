import type { SiteIdentity } from "./types";

const latitude = 40.6281394;
const longitude = 14.4899299;
const mapQuery = encodeURIComponent(`${latitude},${longitude}`);

/**
 * Non-localized, audited business details from the current public website.
 * Keep this as the single source of truth for UI, email and structured data.
 */
export const siteIdentity = {
  name: "La Fenice Positano",
  legalName: "La Fenice Bed and Breakfast",
  lodgingType: "BedAndBreakfast",
  siteUrl: "https://www.lafenicepositano.com",
  email: "info@lafenicepositano.com",
  phone: {
    display: "+39 089 875513",
    href: "tel:+39089875513",
  },
  vatNumber: "01222840652",
  address: {
    street: "Via Marconi 4",
    postalCode: "84017",
    locality: "Positano",
    province: "SA",
    region: "Campania",
    countryCode: "IT",
    formatted: "Via Marconi 4, 84017 Positano (SA), Italy",
  },
  coordinates: {
    latitude,
    longitude,
  },
  social: [
    {
      platform: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/lafenicepositano/",
    },
    {
      platform: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/lafenicepositano/",
    },
  ],
  maps: {
    place: `https://www.google.com/maps/search/?api=1&query=${mapQuery}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`,
  },
  photographyCredit: "Tim Evancook",
} as const satisfies SiteIdentity;
