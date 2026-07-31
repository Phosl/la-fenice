// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  it("serializes schema data without allowing a closing script injection", () => {
    const markup = renderToStaticMarkup(
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BedAndBreakfast",
          name: "La Fenice </script><script>alert(1)</script>",
        }}
        id="property-schema"
      />,
    );

    expect(markup).toContain('type="application/ld+json"');
    expect(markup).toContain("\\u003c/script>");
    expect(markup).not.toContain("</script><script>");
  });
});
