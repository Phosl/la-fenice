// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";

import { getAbsoluteUrl, getSiteUrl } from "./site-url";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("site URL", () => {
  it("uses the production domain by default", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getSiteUrl().toString()).toBe(
      "https://www.lafenicepositano.com/",
    );
    expect(getAbsoluteUrl("/rooms")).toBe(
      "https://www.lafenicepositano.com/rooms",
    );
  });

  it("supports a canonical URL override for previews", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com/deployment";

    expect(getSiteUrl().toString()).toBe("https://preview.example.com/");
    expect(getAbsoluteUrl("/it/camere")).toBe(
      "https://preview.example.com/it/camere",
    );
  });

  it("falls back safely when the override is not an HTTP URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "javascript:alert(1)";

    expect(getSiteUrl().toString()).toBe(
      "https://www.lafenicepositano.com/",
    );
  });
});
