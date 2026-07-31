import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("la-fenice-intro-seen", "true");
  });
});

test("renders the English narrative and switches to Italian", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "From the garden to the sea" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.lafenicepositano.com");

  let languageLink = page.locator('header a[hreflang="it"]:visible').first();
  if ((await languageLink.count()) === 0) {
    await page.getByRole("button", { name: /open menu/i }).click();
    languageLink = page.locator('.mobile-nav a[hreflang="it"]:visible').first();
  }
  await languageLink.click();
  await expect(page).toHaveURL(/\/it$/);
  await expect(page.getByRole("heading", { level: 1, name: "Dal giardino al mare" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
});

test("opens and closes the room gallery lightbox", async ({ page }) => {
  await page.goto("/rooms");
  const firstImage = page.getByRole("button", { name: /^view gallery:/i }).first();
  await firstImage.click();
  const lightbox = page.locator("dialog.lightbox[open]");
  await expect(lightbox).toBeVisible();
  await page.getByRole("button", { name: /close gallery/i }).click();
  await expect(lightbox).not.toBeVisible();
});

test("availability form exposes the complete request contract", async ({ page }) => {
  await page.goto("/availability");
  await expect(page.getByLabel("Name *")).toBeVisible();
  await expect(page.getByLabel("Email *")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Guests *")).toHaveAttribute("min", "1");
  await expect(page.getByLabel("Check-in *")).toHaveAttribute("type", "date");
  await expect(page.getByLabel("Check-out *")).toHaveAttribute("type", "date");
  await expect(page.getByRole("button", { name: /send request/i })).toBeVisible();
});

test("legacy PHP paths return a permanent redirect", async ({ request }) => {
  const response = await request.get("/rooms-with-sea-view-positano.php", { maxRedirects: 0 });
  expect(response.status()).toBe(301);
  expect(response.headers().location).toBe("/rooms");
});

test("intro can be skipped and stays dismissed for the session", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  const intro = page.locator(".logo-intro");
  if (await intro.isVisible()) {
    await page.locator(".logo-intro__skip").click();
  }
  await expect(intro).not.toBeVisible();
  await page.reload();
  await expect(intro).not.toBeVisible();
  await context.close();
});
