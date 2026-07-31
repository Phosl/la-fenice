// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LogoLockup } from "./logo-lockup";

describe("LogoLockup", () => {
  it("uses the official blue logo by default", () => {
    const markup = renderToStaticMarkup(<LogoLockup />);

    expect(markup).toContain('aria-label="La Fenice Positano"');
    expect(markup).toContain('src="/logo-la-fenice.svg"');
    expect(markup).not.toContain("logo-la-fenice_white.svg");
  });

  it("uses the official white logo on dark backgrounds", () => {
    const markup = renderToStaticMarkup(<LogoLockup inverse />);

    expect(markup).toContain('src="/logo-la-fenice_white.svg"');
    expect(markup).not.toContain('src="/logo-la-fenice.svg"');
  });

  it("renders both official variants for the adaptive header", () => {
    const markup = renderToStaticMarkup(<LogoLockup adaptive compact />);

    expect(markup).toContain("logo-lockup--adaptive");
    expect(markup).toContain('src="/logo-la-fenice.svg"');
    expect(markup).toContain('src="/logo-la-fenice_white.svg"');
  });
});
