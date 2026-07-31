import { expect, test, type Page } from "@playwright/test";

async function expectHydrated(page: Page) {
  try {
    await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true", {
      timeout: 15_000,
    });
  } catch (error) {
    const [pageErrors, consoleMessages] = await Promise.all([
      page.pageErrors(),
      page.consoleMessages(),
    ]);
    const diagnostics = [
      ...pageErrors.map((entry) => `pageerror: ${entry.message}`),
      ...consoleMessages
        .filter((entry) => entry.type() === "error")
        .map((entry) => `console: ${entry.text()}`),
    ];

    throw new Error(
      `Client hydration did not complete.${diagnostics.length ? `\n${diagnostics.join("\n")}` : " No browser error was reported."}`,
      { cause: error },
    );
  }
}

async function switchLanguage(page: Page, languageName: string) {
  const desktopSwitcher = page.getByRole("button", {
    name: /change language|cambia lingua|sprache wechseln|выбрать язык/i,
  });

  if (await desktopSwitcher.isVisible()) {
    await desktopSwitcher.click();
    await page.getByRole("menuitem", { name: languageName }).click();
  } else {
    await page.getByRole("button", {
      name: /open menu|apri menu|menü öffnen|открыть меню/i,
    }).click();
    await page.getByRole("link", { name: languageName }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("la-fenice-intro-seen", "true");
  });
});

test("renders the English narrative and switches to Italian", async ({ page }) => {
  await page.goto("/");
  await expectHydrated(page);
  await expect(page.getByRole("heading", { level: 1, name: "From the garden to the sea" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.lafenicepositano.com");

  await switchLanguage(page, "Italiano");
  await expect(page).toHaveURL(/\/it$/);
  await expect(page.getByRole("heading", { level: 1, name: "Dal giardino al mare" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
});

test("keeps the equivalent page when switching to German and Russian", async ({ page }) => {
  await page.goto("/rooms");
  await expectHydrated(page);

  await switchLanguage(page, "Deutsch");
  await expect(page).toHaveURL(/\/de\/zimmer$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1, name: /Zimmer im Licht von Positano/ })).toBeVisible();

  await switchLanguage(page, "Русский");
  await expect(page).toHaveURL(/\/ru\/nomera$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1, name: /Номера, наполненные светом/ })).toBeVisible();
});

test("language menu supports keyboard focus and Escape", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1081, "Desktop language menu");

  await page.goto("/");
  await expectHydrated(page);
  const switcher = page.getByRole("button", { name: "Change language" });
  await switcher.focus();
  await page.keyboard.press("ArrowDown");

  const currentLanguage = page.getByRole("menuitem", { name: /English EN/ });
  await expect(currentLanguage).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(switcher).toBeFocused();
});

test("opens and closes the room gallery lightbox", async ({ page }) => {
  await page.goto("/rooms");
  await expectHydrated(page);
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

test("German and Russian forms expose localised email-only contracts", async ({ page }) => {
  await page.goto("/de/verfuegbarkeit");
  await expect(page.getByLabel("Name *")).toBeVisible();
  await expect(page.locator('input[name="locale"]')).toHaveValue("de");
  await expect(page.getByRole("button", { name: /Anfrage senden/i })).toBeVisible();

  await page.goto("/ru/zapros-nalichiya");
  await expect(page.getByLabel("Имя и фамилия *")).toBeVisible();
  await expect(page.locator('input[name="locale"]')).toHaveValue("ru");
  await expect(page.getByRole("button", { name: /Отправить запрос/i })).toBeVisible();
});

test("German and Cyrillic pages fit the active viewport", async ({ page }) => {
  for (const [path, heading] of [
    ["/de", "Vom Garten bis zum Meer"],
    ["/ru", "От сада к морю"],
  ] as const) {
    await page.goto(path);
    await expectHydrated(page);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("mobile heroes keep iPhone gutters without overlapping the sticky CTA", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "Dedicated iPhone geometry check");

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expectHydrated(page);

    const homeGeometry = await page.evaluate(() => {
      const content = document.querySelector<HTMLElement>(".home-hero__content");
      const stickyCta = document.querySelector<HTMLElement>(".mobile-availability");
      if (!content || !stickyCta) throw new Error("Mobile home hero geometry is unavailable");

      const contentRect = content.getBoundingClientRect();
      const stickyCtaRect = stickyCta.getBoundingClientRect();
      return {
        contentLeft: contentRect.left,
        contentRight: contentRect.right,
        contentBottom: contentRect.bottom,
        stickyCtaTop: stickyCtaRect.top,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(homeGeometry.contentLeft).toBeGreaterThanOrEqual(20);
    expect(homeGeometry.viewportWidth - homeGeometry.contentRight).toBeGreaterThanOrEqual(20);
    expect(homeGeometry.stickyCtaTop - homeGeometry.contentBottom).toBeGreaterThanOrEqual(12);

    await page.goto("/de/verfuegbarkeit");
    await expectHydrated(page);

    const pageGeometry = await page.evaluate(() => {
      const content = document.querySelector<HTMLElement>(".page-hero__content");
      const title = document.querySelector<HTMLElement>(".page-hero .display-title");
      if (!content || !title) throw new Error("Mobile page hero geometry is unavailable");

      const contentRect = content.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return {
        contentLeft: contentRect.left,
        contentRight: contentRect.right,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        titleLeft: titleRect.left,
        titleRight: titleRect.right,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(pageGeometry.contentLeft).toBeGreaterThanOrEqual(20);
    expect(pageGeometry.viewportWidth - pageGeometry.contentRight).toBeGreaterThanOrEqual(20);
    expect(pageGeometry.titleLeft).toBeGreaterThanOrEqual(20);
    expect(pageGeometry.titleRight).toBeLessThanOrEqual(pageGeometry.viewportWidth - 20);
    expect(pageGeometry.overflow).toBeLessThanOrEqual(1);
  }
});

test("location pages reveal the verified La Fenice map and directions", async ({ page }) => {
  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=40.6277721%2C14.4937307";
  const embedUrl =
    "https://www.google.com/maps?q=40.6277721,14.4937307&z=15&output=embed";

  await page.route("https://www.google.com/maps**", (route) => route.abort());

  for (const [path, openMapLabel, directionsLabel] of [
    ["/location", "Open interactive map", "Get directions"],
    ["/it/posizione", "Apri la mappa interattiva", "Ottieni indicazioni"],
    ["/de/lage", "Interaktive Karte öffnen", "Route planen"],
    ["/ru/raspolozhenie", "Открыть интерактивную карту", "Построить маршрут"],
  ] as const) {
    await page.goto(path);
    await expectHydrated(page);

    const iframe = page.locator(".map-reveal iframe");
    await expect(iframe).toHaveCount(0);
    await expect(page.getByRole("link", { name: directionsLabel })).toHaveAttribute(
      "href",
      directionsUrl,
    );
    await expect(
      page.getByRole("link", {
        name: "Via Guglielmo Marconi 4, 84017 Positano (SA), Italy",
      }),
    ).toHaveAttribute("href", directionsUrl);

    await page.getByRole("button", { name: openMapLabel }).click();
    await expect(iframe).toHaveAttribute("src", embedUrl);
  }
});

test("advertises all experiences with direct email requests", async ({ page }) => {
  await page.goto("/it");
  await expectHydrated(page);
  await expect(
    page.getByRole("heading", { level: 2, name: "Tre modi per incontrare la costa" }),
  ).toBeVisible();

  const requests = page.getByRole("link", { name: "Richiedi via email" });
  await expect(requests).toHaveCount(3);
  for (const link of await requests.all()) {
    await expect(link).toHaveAttribute(
      "href",
      /^mailto:info@lafenicepositano\.com\?subject=.+&body=.+$/,
    );
  }
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
  await expectHydrated(page);
  const intro = page.locator(".logo-intro");
  if (await intro.isVisible()) {
    await page.locator(".logo-intro__skip").click();
  }
  await expect(intro).not.toBeVisible();
  await page.reload();
  await expect(intro).not.toBeVisible();
  await context.close();
});
