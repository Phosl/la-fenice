export const CANONICAL_SITE_URL = "https://www.lafenicepositano.com";

/**
 * Returns the public, canonical origin used by metadata routes and structured data.
 * `NEXT_PUBLIC_SITE_URL` can point previews and non-production builds at their own
 * origin without changing production defaults.
 */
export function getSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    const url = new URL(configuredUrl || CANONICAL_SITE_URL);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new URL(CANONICAL_SITE_URL);
    }

    return new URL(url.origin);
  } catch {
    return new URL(CANONICAL_SITE_URL);
  }
}

export function getAbsoluteUrl(pathname = "/"): string {
  return new URL(pathname, getSiteUrl()).toString();
}
