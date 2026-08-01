// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy, shouldPreventIndexing } from "./proxy";

describe("SEO host guard", () => {
  it("allows the canonical, apex and local development hosts", () => {
    expect(shouldPreventIndexing("www.lafenicepositano.com")).toBe(false);
    expect(shouldPreventIndexing("lafenicepositano.com")).toBe(false);
    expect(shouldPreventIndexing("localhost")).toBe(false);
    expect(shouldPreventIndexing("127.0.0.1")).toBe(false);
  });

  it("prevents indexing on Vercel and other non-canonical hosts", () => {
    expect(shouldPreventIndexing("la-fenice-mu.vercel.app")).toBe(true);
    expect(shouldPreventIndexing("preview.example.com")).toBe(true);
  });

  it("sets an X-Robots-Tag only outside the canonical hosts", () => {
    const previewResponse = proxy(
      new NextRequest("https://la-fenice-mu.vercel.app/rooms"),
    );
    const canonicalResponse = proxy(
      new NextRequest("https://www.lafenicepositano.com/rooms"),
    );
    const forwardedPreviewResponse = proxy(
      new NextRequest("http://127.0.0.1:3100/rooms", {
        headers: { host: "la-fenice-mu.vercel.app" },
      }),
    );

    expect(previewResponse.headers.get("X-Robots-Tag")).toBe(
      "noindex, nofollow",
    );
    expect(canonicalResponse.headers.get("X-Robots-Tag")).toBeNull();
    expect(forwardedPreviewResponse.headers.get("X-Robots-Tag")).toBe(
      "noindex, nofollow",
    );
  });
});
