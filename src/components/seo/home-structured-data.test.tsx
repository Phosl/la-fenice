// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getContent } from "@/lib/content";
import { buildHomeStructuredData } from "./home-structured-data";

describe("home structured data", () => {
  it("describes the website, lodging and English home with stable identifiers", () => {
    const data = buildHomeStructuredData(getContent("en")) as {
      "@context": string;
      "@graph": Array<Record<string, unknown>>;
    };

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebSite",
          "@id": "https://www.lafenicepositano.com/#website",
          name: "La Fenice Positano",
          alternateName: "La Fenice",
        }),
        expect.objectContaining({
          "@type": "BedAndBreakfast",
          "@id": "https://www.lafenicepositano.com/#lodging",
          hasMap: expect.stringContaining("google.com/maps"),
        }),
        expect.objectContaining({
          "@type": "WebPage",
          "@id": "https://www.lafenicepositano.com/#webpage",
          inLanguage: "en-GB",
        }),
      ]),
    );
  });

  it("keeps translated home pages linked to the canonical website entity", () => {
    const data = buildHomeStructuredData(getContent("it")) as {
      "@graph": Array<Record<string, unknown>>;
    };

    expect(data["@graph"]).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ "@type": "WebSite" })]),
    );
    expect(data["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "WebPage",
          "@id": "https://www.lafenicepositano.com/it#webpage",
          inLanguage: "it-IT",
        }),
      ]),
    );
  });
});
