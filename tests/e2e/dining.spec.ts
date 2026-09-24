import { expect, test, type Page } from "@playwright/test";
import { guestDemoCopy } from "../../src/components/demo/guest/copy";
import { createDiningSeedCatalog } from "../../src/lib/demo-portal/seed";
import type { DemoLocale, DemoPortalState } from "../../src/lib/demo-portal/types";

const storageKey = "la-fenice:demo-portal:v4";
const products = createDiningSeedCatalog("2026-09-24T10:00:00.000Z");

async function guestLogin(page: Page, locale: DemoLocale) {
  await page.route("**/api/demo/concierge/session", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ authenticated: true, configured: false }),
  }));
  await page.goto("/demo/login");
  await page.locator("#guest-language").selectOption(locale);
  await page.locator("#guest-login-code").fill("cliente");
  await page.locator("#guest-login-password").fill("cliente");
  await page.getByRole("button", { name: guestDemoCopy[locale].login.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/stay$/);
}

for (const locale of ["en", "it", "de", "ru"] as const) {
  test(`lunch and evening requests are translated, keyboard reachable and persistent (${locale})`, async ({ page }) => {
    const copy = guestDemoCopy[locale];
    await guestLogin(page, locale);
    for (const product of products) {
      const section = page.getByRole("region", { name: copy.order.categories[product.category], exact: true });
      await expect(section.getByText(product.labels[locale], { exact: true })).toBeVisible();
      await expect(section.getByText(product.description![locale], { exact: true })).toBeVisible();
      await expect(section.getByText(copy.order.priceOnRequest, { exact: true })).toBeVisible();
    }
    const categories = page.getByRole("group", { name: copy.order.categoryLabel });
    const dinner = categories.getByRole("button", { name: new RegExp(copy.order.categories.dinner) });
    await dinner.focus();
    await page.keyboard.press("Enter");
    await expect(dinner).toBeFocused();
    await expect(dinner).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: copy.order.categories.lunch, exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: `${copy.order.quantityIncrease}: Pizza Fenice`, exact: true }).click();
    await categories.getByRole("button", { name: new RegExp(`^${copy.order.categories.all}`) }).click();
    await expect(page.getByRole("complementary").getByText("Pizza Fenice", { exact: true })).toBeVisible();
    await page.getByRole("tabpanel", { name: copy.day.orderTab, exact: true }).getByLabel(copy.order.timeLabel, { exact: true }).fill("20:00");
    await page.getByRole("button", { name: copy.order.submit, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: copy.order.success })).toBeVisible();
    await page.reload();
    const requests = page.getByRole("region", { name: copy.requests.title });
    await expect(requests.getByText("Pizza Fenice", { exact: true })).toBeVisible();
    await expect(requests.getByText(copy.statuses.pending, { exact: true })).toBeVisible();
    const saved: DemoPortalState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
    expect(saved.orders).toHaveLength(1);
    expect(saved.orders[0].lines[0]).toMatchObject({ catalogItemId: "product-pizza-fenice", quantity: 1 });
    expect(saved.orders[0].lines[0].unitPriceCents).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test("staff can edit lunch details and keep it hidden across reloads", async ({ page }) => {
  await page.goto("/demo/admin/login");
  await page.getByLabel("Utente", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("admin");
  await page.getByRole("button", { name: "Entra nel pannello" }).click();
  await expect(page).toHaveURL(/\/demo\/admin$/);
  await page.getByRole("tab", { name: "Shop" }).click();
  await expect(page.getByLabel("Categoria", { exact: true })).toHaveValue("lunch");
  await expect(page.getByLabel("Descrizione · Italiano", { exact: true })).toHaveValue(products[0].description!.it);
  await page.getByLabel("Descrizione · Italiano", { exact: true }).fill("Menu di prova aggiornato dallo staff.");
  await page.getByRole("button", { name: "Salva prodotto", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Elemento aggiornato." })).toBeVisible();
  await page.getByRole("button", { name: "Nascondi dallo Shop", exact: true }).click();
  await page.reload();
  await page.getByRole("tab", { name: "Shop" }).click();
  await expect(page.getByLabel("Descrizione · Italiano", { exact: true })).toHaveValue("Menu di prova aggiornato dallo staff.");
  await expect(page.getByRole("button", { name: "Mostra nello Shop", exact: true })).toBeVisible();
  const state: DemoPortalState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  const lunch = state.catalog.find((item) => item.id === "product-daily-lunch")!;
  expect(lunch.active).toBe(false);
  expect(lunch.description?.en).toBe(products[0].description!.en);
  expect(lunch).not.toHaveProperty("priceCents");
});

test("an existing browser gains only the two dining entries without a reset", async ({ page }) => {
  await guestLogin(page, "it");
  const original = await page.evaluate((key) => {
    const state: DemoPortalState = JSON.parse(localStorage.getItem(key)!);
    state.catalog = state.catalog.filter((item) => !["product-daily-lunch", "product-pizza-fenice"].includes(item.id));
    state.catalog[0].active = false;
    state.catalog[0].labels.it = "Modifica staff da preservare";
    state.stays[0].autoAnchorToToday = false;
    localStorage.setItem(key, JSON.stringify(state));
    return state;
  }, storageKey);
  await page.reload();
  await expect(page.getByRole("region", { name: "Pranzo · Menu del giorno", exact: true })).toBeVisible();
  const updated: DemoPortalState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(updated.catalog.slice(0, original.catalog.length)).toEqual(original.catalog);
  expect(updated.catalog.slice(original.catalog.length).map((item) => item.id)).toEqual(products.map((item) => item.id));
  expect({ ...updated, catalog: original.catalog, revision: original.revision, updatedAt: original.updatedAt }).toEqual(original);
});

test("corrupt saved data shows a recoverable error and is never overwritten", async ({ page }) => {
  await page.goto("/demo/login");
  await page.getByLabel("Utente", { exact: true }).waitFor();
  await page.evaluate((key) => localStorage.setItem(key, "{malformed"), storageKey);
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Nulla è stato cancellato o sostituito" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Riprova", exact: true })).toBeVisible();
  await expect(page.getByLabel("Utente", { exact: true })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe("{malformed");
});
