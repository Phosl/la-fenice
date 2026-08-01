// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import {
  getLanguageAlternates,
  getLocalizedPath,
  legacyRedirects,
  routeKeys,
  supportedLocales,
} from "../lib/content/routes";
import type { Locale } from "../lib/content/types";
import { buildMetadata } from "../lib/page-metadata";
import robots from "./robots";
import sitemap from "./sitemap";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("legacy routing", () => {
  it("keeps every audited PHP URL in the shared route map", () => {
    const routeMap = legacyRedirects.map(
      ({ source, destination, permanent }) => [
        source,
        destination,
        permanent,
      ],
    );

    expect(routeMap).toEqual([
      ["/index.php", "/", true],
      ["/rooms-with-sea-view-positano.php", "/rooms", true],
      ["/private-swimming-pool-positano.php", "/pool", true],
      ["/private-beach-positano.php", "/private-beach", true],
      ["/typical-specialities-positano.php", "/garden-table", true],
      ["/where-we-are.php", "/location", true],
      ["/how_to_arrive_in_positano.php", "/getting-here", true],
      ["/availability-request.php", "/availability", true],
      ["/privacy-policy.php", "/privacy", true],
      ["/terms-and-conditions.php", "/terms", true],
    ]);
  });

  it("serves the legacy route map as exact HTTP 301 redirects", async () => {
    expect(nextConfig.redirects).toBeTypeOf("function");

    const redirects = await nextConfig.redirects?.();

    expect(redirects).toHaveLength(legacyRedirects.length);
    expect(redirects).toEqual(
      legacyRedirects.map(({ source, destination }) => ({
        source,
        destination,
        statusCode: 301,
      })),
    );
  });
});

describe("localized routing", () => {
  it("publishes the approved German and Russian ASCII slugs", () => {
    expect(
      Object.fromEntries(
        routeKeys.map((route) => [route, getLocalizedPath(route, "de")]),
      ),
    ).toEqual({
      home: "/de",
      rooms: "/de/zimmer",
      pool: "/de/pool",
      privateBeach: "/de/privatstrand",
      gardenTable: "/de/garten-und-genuss",
      location: "/de/lage",
      gettingHere: "/de/anreise",
      availability: "/de/verfuegbarkeit",
      privacy: "/de/datenschutz",
      terms: "/de/bedingungen",
    });

    expect(
      Object.fromEntries(
        routeKeys.map((route) => [route, getLocalizedPath(route, "ru")]),
      ),
    ).toEqual({
      home: "/ru",
      rooms: "/ru/nomera",
      pool: "/ru/basseyn",
      privateBeach: "/ru/chastnyy-plyazh",
      gardenTable: "/ru/sad-i-vkusy",
      location: "/ru/raspolozhenie",
      gettingHere: "/ru/kak-dobratsya",
      availability: "/ru/zapros-nalichiya",
      privacy: "/ru/konfidentsialnost",
      terms: "/ru/usloviya",
    });
  });
});

describe("metadata routes", () => {
  it("publishes 32 localized URLs with reciprocal language alternates", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com";
    const entries = sitemap();

    expect(entries).toHaveLength(32);
    expect(entries).toHaveLength(
      (routeKeys.length - 2) * supportedLocales.length,
    );
    expect(
      entries.find(({ url }) => url === "https://preview.example.com/"),
    ).toMatchObject({
      priority: 1,
      alternates: {
        languages: {
          en: "https://preview.example.com/",
          it: "https://preview.example.com/it",
          de: "https://preview.example.com/de",
          ru: "https://preview.example.com/ru",
          "x-default": "https://preview.example.com/",
        },
      },
    });
    expect(
      entries.find(
        ({ url }) => url === "https://preview.example.com/it/camere",
      ),
    ).toMatchObject({ priority: 0.9 });
    expect(
      entries.find(
        ({ url }) => url === "https://preview.example.com/de/zimmer",
      ),
    ).toMatchObject({ priority: 0.9 });
    expect(
      entries.find(
        ({ url }) =>
          url === "https://preview.example.com/ru/zapros-nalichiya",
      ),
    ).toMatchObject({ priority: 0.9 });

    for (const locale of supportedLocales) {
      for (const route of ["privacy", "terms"] as const) {
        expect(
          entries.some(
            ({ url }) =>
              url ===
              `https://preview.example.com${getLocalizedPath(route, locale)}`,
          ),
        ).toBe(false);
      }
    }
  });

  it("builds canonical, Open Graph and hreflang metadata for all locales", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com";
    const openGraphLocales = {
      en: "en_GB",
      it: "it_IT",
      de: "de_DE",
      ru: "ru_RU",
    } as const satisfies Record<Locale, string>;

    for (const locale of supportedLocales) {
      const canonicalPath = getLocalizedPath("rooms", locale);
      const metadata = buildMetadata(locale, "rooms");

      expect(metadata.alternates).toEqual({
        canonical: canonicalPath,
        languages: getLanguageAlternates("rooms"),
      });
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocales[locale],
        alternateLocale: Object.entries(openGraphLocales)
          .filter(([candidate]) => candidate !== locale)
          .map(([, openGraphLocale]) => openGraphLocale),
        url: `https://preview.example.com${canonicalPath}`,
      });
    }
  });

  it("adds baseline security headers to every route", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");

    const headers = await nextConfig.headers?.();
    expect(headers).toHaveLength(1);
    expect(headers?.[0]).toMatchObject({
      source: "/:path*",
      headers: expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ]),
    });
  });

  it("advertises a canonical sitemap and keeps private surfaces out of crawlers", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com";

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/demo/"],
      },
      sitemap: "https://preview.example.com/sitemap.xml",
      host: "https://preview.example.com",
    });
  });
});
