// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { legacyRedirects, routeKeys } from "../lib/content/routes";
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

describe("metadata routes", () => {
  it("publishes both locales with reciprocal language alternates", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com";
    const entries = sitemap();

    expect(entries).toHaveLength((routeKeys.length - 2) * 2);
    expect(entries.find(({ url }) => url === "https://preview.example.com/")).toMatchObject(
      {
        priority: 1,
        alternates: {
          languages: {
            en: "https://preview.example.com/",
            it: "https://preview.example.com/it",
            "x-default": "https://preview.example.com/",
          },
        },
      },
    );
    expect(
      entries.find(
        ({ url }) => url === "https://preview.example.com/it/camere",
      ),
    ).toMatchObject({ priority: 0.9 });
    expect(entries.some(({ url }) => url.endsWith("/privacy"))).toBe(false);
    expect(entries.some(({ url }) => url.endsWith("/terms"))).toBe(false);
    expect(entries.some(({ url }) => url.endsWith("/condizioni"))).toBe(false);
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
        disallow: ["/admin/", "/api/"],
      },
      sitemap: "https://preview.example.com/sitemap.xml",
      host: "https://preview.example.com",
    });
  });
});
