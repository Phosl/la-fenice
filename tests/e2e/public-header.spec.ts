import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("la-fenice-intro-seen", "true");
  });
});

test("compact mobile navigation keeps fixed layers from overlapping", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "Dedicated 360px header geometry check");

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  const navigation = page.locator(".mobile-nav");
  const stickyCta = page.locator(".mobile-availability");
  const toggle = page.getByRole("button", { name: /open menu/i });

  await expect(toggle).toBeVisible();
  await expect(stickyCta).toBeVisible();

  const closedGeometry = await page.evaluate(() => {
    const headerElement = document.querySelector<HTMLElement>(".site-header");
    const brandElement = document.querySelector<HTMLElement>(".site-header__brand");
    const ctaElement = document.querySelector<HTMLElement>(".mobile-availability");
    if (!headerElement || !brandElement || !ctaElement) {
      throw new Error("Public header geometry is unavailable");
    }

    const headerRect = headerElement.getBoundingClientRect();
    const brandRect = brandElement.getBoundingClientRect();
    const ctaRect = ctaElement.getBoundingClientRect();
    return {
      brandWidth: brandRect.width,
      ctaBottomGap: window.innerHeight - ctaRect.bottom,
      ctaWidth: ctaRect.width,
      headerHeight: headerRect.height,
      viewportWidth: window.innerWidth,
    };
  });

  expect(closedGeometry.headerHeight).toBeLessThanOrEqual(65);
  expect(closedGeometry.brandWidth).toBeLessThanOrEqual(83);
  expect(closedGeometry.ctaWidth).toBeLessThan(closedGeometry.viewportWidth - 32);
  expect(closedGeometry.ctaBottomGap).toBeGreaterThanOrEqual(13);

  await toggle.click();
  await expect(navigation).toHaveAttribute("data-open", "true");
  await expect(stickyCta).toBeHidden();
  await expect(page.locator(".mobile-nav__link").first()).toBeFocused();

  const openGeometry = await page.evaluate(() => {
    const headerElement = document.querySelector<HTMLElement>(".site-header");
    const navigationElement = document.querySelector<HTMLElement>(".mobile-nav");
    const ctaElement = document.querySelector<HTMLElement>(".mobile-availability");
    const transitionElement = document.querySelector<HTMLElement>(".page-transition");
    if (!headerElement || !navigationElement || !ctaElement || !transitionElement) {
      throw new Error("Public navigation layers are unavailable");
    }

    const navigationRect = navigationElement.getBoundingClientRect();
    const bottomElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 8);
    return {
      accentLayer: Number.parseInt(getComputedStyle(transitionElement, "::before").zIndex, 10),
      ctaLayer: Number.parseInt(getComputedStyle(ctaElement).zIndex, 10),
      headerLayer: Number.parseInt(getComputedStyle(headerElement).zIndex, 10),
      navigationHeight: navigationRect.height,
      navigationLayer: Number.parseInt(getComputedStyle(navigationElement).zIndex, 10),
      navigationWidth: navigationRect.width,
      stickyCtaAtBottom: Boolean(bottomElement?.closest(".mobile-availability")),
    };
  });

  expect(openGeometry.navigationWidth).toBe(360);
  expect(openGeometry.navigationHeight).toBe(800);
  expect(openGeometry.headerLayer).toBeGreaterThan(openGeometry.navigationLayer);
  expect(openGeometry.navigationLayer).toBeGreaterThan(openGeometry.accentLayer);
  expect(openGeometry.accentLayer).toBeGreaterThan(openGeometry.ctaLayer);
  expect(openGeometry.stickyCtaAtBottom).toBe(false);

  await page.keyboard.press("Escape");
  await expect(navigation).toHaveAttribute("data-open", "false");
  await expect(toggle).toBeFocused();
  await expect(stickyCta).toBeVisible();
});
