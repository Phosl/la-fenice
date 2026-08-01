// @vitest-environment node

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getContent, siteContent } from "./index";
import { buildNavigation } from "./navigation";
import {
  getLocalizedPath,
  getRouteKeyFromPath,
  routeKeys,
  supportedLocales,
  switchLocalePath,
} from "./routes";
import { siteIdentity } from "./site";
import type { GalleryImage } from "./types";

const isGalleryImage = (value: unknown): value is GalleryImage => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<GalleryImage>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.src === "string" &&
    typeof candidate.alt === "string" &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number"
  );
};

const collectImages = (value: unknown, images: GalleryImage[] = []) => {
  if (isGalleryImage(value)) {
    images.push(value);
    return images;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectImages(item, images));
    return images;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectImages(item, images));
  }

  return images;
};

describe("localized content contract", () => {
  it("covers every route in all locales with unique metadata", () => {
    for (const locale of supportedLocales) {
      const content = getContent(locale);
      const titles = routeKeys.map((route) => content.pages[route].metadata.title);

      expect(content.locale).toBe(locale);
      expect(Object.keys(content.pages)).toEqual(routeKeys);
      expect(new Set(titles).size).toBe(routeKeys.length);

      for (const route of routeKeys) {
        const page = content.pages[route];
        expect(page.route).toBe(route);
        expect(page.metadata.title.length).toBeGreaterThan(10);
        expect(page.metadata.description.length).toBeGreaterThan(30);
      }
    }
  });

  it("keeps the approved garden-to-sea concept aligned across locales", () => {
    expect(getContent("en").pages.home.hero.title).toBe(
      "From the garden to the sea",
    );
    expect(getContent("it").pages.home.hero.title).toBe(
      "Dal giardino al mare",
    );
  });

  it("publishes the three email-request experiences in every locale", () => {
    for (const locale of supportedLocales) {
      const experiences = getContent(locale).pages.home.experiences;

      expect(experiences.items.map(({ id }) => id)).toEqual([
        "fishing",
        "boatTrip",
        "lemonGrove",
      ]);
      for (const experience of experiences.items) {
        expect(experience.title.length).toBeGreaterThanOrEqual(5);
        expect(experience.text.length).toBeGreaterThan(30);
        expect(experience.emailSubject.length).toBeGreaterThan(5);
        expect(experience.emailBody.length).toBeGreaterThan(30);
      }
    }
  });

  it("keeps the editorial page structure concise in every locale", () => {
    for (const locale of supportedLocales) {
      const pages = getContent(locale).pages;

      expect(pages.home.locationTeaser.text.trim().length).toBeGreaterThan(20);
      for (const route of [
        "rooms",
        "pool",
        "privateBeach",
        "gardenTable",
        "location",
      ] as const) {
        expect(pages[route].sections).toHaveLength(1);
        expect(pages[route].sections[0].paragraphs.length).toBeLessThanOrEqual(2);
      }

      for (const mode of pages.gettingHere.modes) {
        for (const route of mode.routes) {
          expect(route.steps.length).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("provides meaningful alt text and resolvable local fallback images", () => {
    for (const content of Object.values(siteContent)) {
      const images = collectImages(content.pages);

      expect(images.length).toBeGreaterThan(10);
      for (const image of images) {
        expect(image.alt.trim().length).toBeGreaterThan(8);
        expect(image.width).toBeGreaterThan(0);
        expect(image.height).toBeGreaterThan(0);
        expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
        if (image.focus) {
          for (const point of [image.focus.desktop, image.focus.mobile]) {
            if (!point) continue;
            expect(point.x).toBeGreaterThanOrEqual(0);
            expect(point.x).toBeLessThanOrEqual(100);
            expect(point.y).toBeGreaterThanOrEqual(0);
            expect(point.y).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });

  it("uses restored photographs for every public-page hero", () => {
    for (const content of Object.values(siteContent)) {
      const { pages } = content;
      const heroImages = [
        pages.home.hero.image,
        pages.rooms.heroImage,
        pages.pool.heroImage,
        pages.privateBeach.heroImage,
        pages.gardenTable.heroImage,
        pages.location.heroImage,
        pages.gettingHere.heroImage,
        pages.availability.heroImage,
      ];

      for (const image of heroImages) {
        expect(image.src).toMatch(/^\/images\/restored\//);
        expect(image.width).toBeGreaterThanOrEqual(2000);
        expect(image.height).toBeGreaterThanOrEqual(700);
        expect(image.width * image.height).toBeGreaterThanOrEqual(1_500_000);
      }
    }
  });

  it("keeps unapproved legal pages explicit and out of search indexes", () => {
    for (const locale of supportedLocales) {
      const { privacy, terms } = getContent(locale).pages;

      expect(privacy.status).toBe("review-required");
      expect(terms.status).toBe("review-required");
      expect(privacy.metadata.robots).toBe("noindex");
      expect(terms.metadata.robots).toBe("noindex");
    }
  });
});

describe("audited site identity", () => {
  it("publishes the official Instagram profile", () => {
    expect(siteIdentity.social).toContainEqual({
      platform: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/lafenicepositano/",
    });
  });

  it("uses the verified La Fenice address and Google Maps listing", () => {
    expect(siteIdentity.address.street).toBe("Via Guglielmo Marconi 4");
    expect(siteIdentity.address.formatted).toBe(
      "Via Guglielmo Marconi 4, 84017 Positano (SA), Italy",
    );
    expect(siteIdentity.coordinates).toEqual({
      latitude: 40.6277721,
      longitude: 14.4937307,
    });
    expect(siteIdentity.maps.place).toBe(
      "https://www.google.com/maps?cid=7908776521279981555",
    );
    expect(siteIdentity.maps.directions).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=40.6277721%2C14.4937307",
    );
    expect(siteIdentity.maps.embed).toBe(
      "https://www.google.com/maps?q=40.6277721,14.4937307&z=16&output=embed",
    );
  });
});

describe("localized navigation", () => {
  it("builds links from the shared route map", () => {
    for (const locale of supportedLocales) {
      const content = getContent(locale);
      const navigation = buildNavigation(locale, content.navigation);

      for (const link of [
        ...navigation.primary,
        ...navigation.utility,
        navigation.availability,
      ]) {
        expect(link.href).toBe(getLocalizedPath(link.route, locale));
        expect(getRouteKeyFromPath(link.href)).toBe(link.route);
      }
    }
  });

  it("switches between reciprocal localized paths", () => {
    expect(switchLocalePath("/rooms", "it")).toBe("/it/camere");
    expect(switchLocalePath("/it/orto-e-sapori", "en")).toBe("/garden-table");
    expect(switchLocalePath("/de/zimmer", "ru")).toBe("/ru/nomera");
    expect(switchLocalePath("/ru/kak-dobratsya", "de")).toBe("/de/anreise");
  });
});
