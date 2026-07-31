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
        expect(experience.title.length).toBeGreaterThan(5);
        expect(experience.text.length).toBeGreaterThan(30);
        expect(experience.emailSubject.length).toBeGreaterThan(5);
        expect(experience.emailBody.length).toBeGreaterThan(30);
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
