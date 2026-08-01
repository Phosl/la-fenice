import type { SiteIdentity } from "./types";
import { CANONICAL_SITE_URL } from "../site-url";

const latitude = 40.6277721;
const longitude = 14.4937307;
const mapQuery = encodeURIComponent(`${latitude},${longitude}`);
const googleMapsCid = "7908776521279981555";

/**
 * Non-localized, audited business details from the current public website.
 * Keep this as the single source of truth for UI, email and structured data.
 */
export const siteIdentity = {
  name: "La Fenice Positano",
  legalName: "La Fenice Bed and Breakfast",
  lodgingType: "BedAndBreakfast",
  siteUrl: CANONICAL_SITE_URL,
  email: "info@lafenicepositano.com",
  phone: {
    display: "+39 089 875513",
    href: "tel:+39089875513",
  },
  vatNumber: "01222840652",
  address: {
    street: "Via Guglielmo Marconi 4",
    postalCode: "84017",
    locality: "Positano",
    province: "SA",
    region: "Campania",
    countryCode: "IT",
    formatted: "Via Guglielmo Marconi 4, 84017 Positano (SA), Italy",
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
    place: `https://www.google.com/maps?cid=${googleMapsCid}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`,
    embed: `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`,
  },
  photographyCredit: "Tim Evancook",
} as const satisfies SiteIdentity;
