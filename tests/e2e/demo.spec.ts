import { expect, test, type Page } from "@playwright/test";

const GUEST_CODE = "cliente";
const GUEST_PASSWORD = "cliente";
const ADMIN_CODE = "admin";
const ADMIN_PASSWORD = "admin";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: element.className,
          overflow: Math.ceil(rect.right - viewportWidth),
          tagName: element.tagName,
        };
      })
      .filter(({ overflow }) => overflow > 1)
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 5);

    return {
      amount: document.documentElement.scrollWidth - viewportWidth,
      offenders,
    };
  });

  expect(overflow.amount, JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(1);
}

async function expectDialogIsTopmost(page: Page, accessibleName: string | RegExp) {
  const dialog = page.getByRole("dialog", { name: accessibleName });
  await expect(dialog).toBeVisible();
  const isTopmost = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
    const centerY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
    const topmost = document.elementFromPoint(centerX, centerY);
    return topmost !== null && element.contains(topmost);
  });
  expect(isTopmost).toBe(true);
}

async function loginAsGuest(page: Page) {
  await page.goto("/demo/login");
  await page.getByLabel("Utente", { exact: true }).fill(GUEST_CODE);
  await page.getByLabel("Password").fill(GUEST_PASSWORD);
  await page.getByRole("button", { name: "Entra nel soggiorno" }).click();
  await expect(page).toHaveURL(/\/demo\/stay$/);
  await expect(page.getByRole("heading", { level: 1, name: /Famiglia Rossi/ })).toBeVisible();
}

async function createCapreseOrder(page: Page) {
  const caprese = page
    .getByRole("article")
    .filter({ has: page.getByText("Panino caprese", { exact: true }) })
    .first();
  await caprese.getByRole("button", { name: "Aumenta quantità: Panino caprese" }).click();
  await page.getByRole("button", { name: /Invia richiesta d.?ordine/i }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "La richiesta è stata inviata" }),
  ).toBeVisible();

  const requests = page.getByRole("region", { name: "Le tue richieste" });
  const request = requests.getByRole("article").filter({ hasText: "Panino caprese" });
  await expect(request).toHaveCount(1);
  await expect(request.getByText("In attesa", { exact: true })).toBeVisible();
  return request;
}

async function createFishingRequest(page: Page) {
  await page.getByRole("tab", { name: "Attività" }).click();
  await page.getByRole("button", { name: "Richiedi questa attività" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "La richiesta attività è stata inviata" }),
  ).toBeVisible();

  const request = page
    .getByRole("region", { name: "Le tue richieste" })
    .getByRole("article")
    .filter({ hasText: "Esperienza di pesca" });
  await expect(request).toHaveCount(1);
  await expect(request.getByText("In attesa", { exact: true })).toBeVisible();
}

async function loginAsAdmin(page: Page) {
  await page.goto("/demo/admin/login");
  await page.getByLabel("Utente", { exact: true }).fill(ADMIN_CODE);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entra nel pannello" }).click();
  await expect(page).toHaveURL(/\/demo\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Gestione ospiti" })).toBeVisible();
}

test("demo routes are explicitly excluded from indexing", async ({ page }) => {
  await page.goto("/demo/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/i);
});

test("guest login, stay calendar, order persistence, cancellation and guard work", async ({ page }) => {
  await page.goto("/demo/login");
  await expect(
    page.getByRole("heading", { level: 1, name: "Benvenuto a La Fenice" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByLabel("Utente", { exact: true }).fill(GUEST_CODE);
  await page.getByLabel("Password").fill("password-errata");
  await page.getByRole("button", { name: "Entra nel soggiorno" }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "Il codice o la password non sono validi. Riprova.",
    }),
  ).toBeVisible();

  await page.getByLabel("Password").fill(GUEST_PASSWORD);
  await page.getByRole("button", { name: "Entra nel soggiorno" }).click();
  await expect(page).toHaveURL(/\/demo\/stay$/);
  await expect(page.getByRole("heading", { level: 1, name: /Famiglia Rossi/ })).toBeVisible();

  const today = page.locator('button[aria-current="date"]');
  await expect(today).toHaveCount(1);
  await expect(today).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Check-out/ })).toBeDisabled();
  await expect(page.getByRole("tab", { name: "Shop" })).toHaveAttribute("aria-selected", "true");
  const shopFilters = page.getByRole("group", {
    name: "Filtra i prodotti dello shop per categoria",
  });
  await shopFilters.getByRole("button", { name: /Bevande/ }).click();
  await expect(page.getByText("Panino caprese", { exact: true })).toHaveCount(0);
  await shopFilters.getByRole("button", { name: /Tutto/ }).click();
  await expect(page.getByText("Panino caprese", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  let request = await createCapreseOrder(page);
  await createFishingRequest(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Famiglia Rossi/ })).toBeVisible();

  const requests = page.getByRole("region", { name: "Le tue richieste" });
  request = requests.getByRole("article").filter({ hasText: "Panino caprese" });
  await expect(request).toHaveCount(1);
  await expect(request.getByText("In attesa", { exact: true })).toBeVisible();

  await request.getByRole("button", { name: "Annulla richiesta" }).click();
  await expect(request.getByText("Annullato", { exact: true })).toBeVisible();
  await expect(request.getByRole("button", { name: "Annulla richiesta" })).toHaveCount(0);

  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page).toHaveURL(/\/demo\/login$/);
  await page.goto("/demo/stay");
  await expect(page).toHaveURL(/\/demo\/login$/);
  await expect(page.getByRole("heading", { level: 1, name: "Benvenuto a La Fenice" })).toBeVisible();
});

test("guest language follows the selected Russian locale", async ({ page }) => {
  await page.goto("/demo/login");
  await page.getByLabel("Lingua").selectOption("ru");
  await expect(
    page.getByRole("heading", { level: 1, name: "Добро пожаловать в La Fenice" }),
  ).toBeVisible();
  await page.getByLabel("Пользователь").fill(GUEST_CODE);
  await page.getByLabel("Пароль").fill(GUEST_PASSWORD);
  await page.getByRole("button", { name: "Открыть проживание" }).click();
  await expect(page).toHaveURL(/\/demo\/stay$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("guest browses the Positano guide and sends a non-binding request", async ({ page }) => {
  await loginAsGuest(page);
  await page.getByRole("link", { name: "Guida a Positano" }).click();
  await expect(page).toHaveURL(/\/demo\/guide$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "La nostra Positano" }),
  ).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "24 luoghi" })).toBeVisible();

  const filters = page.getByRole("group", { name: "Filtra i luoghi per categoria" });
  await filters.getByRole("button", { name: "Sul mare" }).click();
  await expect(page.getByRole("status").filter({ hasText: "6 luoghi" })).toBeVisible();
  await filters.getByRole("button", { name: "Tutti" }).click();
  await page.getByLabel("Cerca nella guida").fill("Tre Sorelle");

  const place = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { level: 3, name: "Le Tre Sorelle" }) });
  await expect(place).toHaveCount(1);
  await expect(place.getByRole("link", { name: /Sito/ })).toHaveAttribute(
    "href",
    /letresorellepositano\.it/,
  );
  await expect(place.getByRole("link", { name: /Apri in Maps/ })).toHaveAttribute(
    "href",
    /google\.com\/maps/,
  );

  const requestButton = place.getByRole("button", { name: "Chiedi a La Fenice" });
  await requestButton.click();
  const dialog = page.getByRole("dialog", { name: "Richiedi informazioni" });
  await expectDialogIsTopmost(page, "Richiedi informazioni");
  await expect(dialog.getByText(/non una prenotazione confermata/i)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(requestButton).toBeFocused();

  await requestButton.click();
  const requestDialog = page.getByRole("dialog", { name: "Richiedi informazioni" });
  await requestDialog.getByLabel("Orario preferito").fill("20:00");
  await requestDialog.getByLabel("Partecipanti").selectOption("2");
  await requestDialog.getByLabel("Note").fill("Un tavolo tranquillo, se possibile.");
  await requestDialog.getByRole("button", { name: "Invia richiesta" }).click();
  await expect(requestDialog.getByRole("status")).toContainText(
    "La richiesta è stata inviata",
  );
  await requestDialog.getByRole("button", { name: "Fatto" }).click();

  const requests = page.getByRole("region", { name: "Richieste dalla guida" });
  const request = requests.getByRole("article").filter({ hasText: "Le Tre Sorelle" });
  await expect(request).toHaveCount(1);
  await expect(request.getByText("In attesa", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Richieste dalla guida" })
      .getByRole("article")
      .filter({ hasText: "Le Tre Sorelle" }),
  ).toHaveCount(1);
  await expectNoHorizontalOverflow(page);

  await page.getByLabel("Lingua").selectOption("ru");
  await expect(page.getByRole("heading", { level: 1, name: "Наш Позитано" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});

test("staff manages guide places and confirms a concierge request", async ({ page }) => {
  await loginAsGuest(page);
  await page.getByRole("link", { name: "Guida a Positano" }).click();
  const leTreSorelle = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { level: 3, name: "Le Tre Sorelle" }) });
  await leTreSorelle.getByRole("button", { name: "Chiedi a La Fenice" }).click();
  const requestDialog = page.getByRole("dialog", { name: "Richiedi informazioni" });
  await requestDialog.getByLabel("Orario preferito").fill("19:30");
  await requestDialog.getByRole("button", { name: "Invia richiesta" }).click();
  await requestDialog.getByRole("button", { name: "Fatto" }).click();
  await page.getByRole("button", { name: "Esci" }).click();

  await loginAsAdmin(page);
  const conciergeRequest = page.getByRole("button", { name: /Le Tre Sorelle/ }).first();
  await expect(conciergeRequest).toContainText("Concierge");
  await conciergeRequest.click();
  await page.getByLabel("Stato richiesta").selectOption("confirmed");
  await page.getByLabel("Nota dello staff").fill("Richiesta inoltrata, attendiamo conferma.");
  await page.getByRole("button", { name: "Salva aggiornamento" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Richiesta aggiornata" })).toBeVisible();

  await page.getByRole("tab", { name: "Guida" }).click();
  await expect(page.getByText("24 luoghi visibili")).toBeVisible();
  await page.getByRole("button", { name: "Aggiungi luogo" }).click();
  const placeDialog = page.getByRole("dialog", { name: "Nuovo luogo" });
  await expectDialogIsTopmost(page, "Nuovo luogo");
  await placeDialog.getByLabel("Categoria").selectOption("essentials");
  await placeDialog.getByLabel("Indirizzo").fill("Via demo 1, Positano");
  await placeDialog.getByLabel("Sito ufficiale").fill("https://example.com/positano-demo");
  await placeDialog.getByLabel("Google Maps").fill("https://www.google.com/maps/search/?api=1&query=Positano");

  const nameFields = placeDialog.getByRole("group", { name: "Nome mostrato agli ospiti" });
  await nameFields.getByLabel("Italiano").fill("Belvedere demo");
  await nameFields.getByLabel("English").fill("Demo viewpoint");
  await nameFields.getByLabel("Deutsch").fill("Demo-Aussichtspunkt");
  await nameFields.getByLabel("Русский").fill("Демо-смотровая");
  const descriptionFields = placeDialog.getByRole("group", { name: "Descrizione breve" });
  await descriptionFields.getByLabel("Italiano").fill("Un indirizzo dimostrativo per la guida ospite.");
  await descriptionFields.getByLabel("English").fill("A demonstration place for the guest guide.");
  await descriptionFields.getByLabel("Deutsch").fill("Ein Demonstrationsort für den Gästeführer.");
  await descriptionFields.getByLabel("Русский").fill("Демонстрационное место для путеводителя гостей.");
  await placeDialog.getByRole("button", { name: "Aggiungi alla guida" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Belvedere demo" })).toBeVisible();

  await page.getByLabel("Indirizzo").fill("Via demo 2, Positano");
  await page.getByRole("button", { name: "Salva luogo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Luogo aggiornato" })).toBeVisible();
  await page.getByRole("button", { name: "Archivia luogo" }).click();
  await expect(page.getByText("Archiviato", { exact: true }).last()).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Guida" }).click();
  await page.getByLabel("Visibilità").selectOption("hidden");
  await expect(page.getByRole("button", { name: /Belvedere demo/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("main").getByRole("button", { name: "Esci" }).click();
  await loginAsGuest(page);
  await page.getByRole("link", { name: "Guida a Positano" }).click();
  const confirmed = page
    .getByRole("region", { name: "Richieste dalla guida" })
    .getByRole("article")
    .filter({ hasText: "Le Tre Sorelle" });
  await expect(confirmed.getByText("Confermata", { exact: true })).toBeVisible();
  await expect(confirmed).toContainText("Richiesta inoltrata, attendiamo conferma.");
  await page.getByLabel("Cerca nella guida").fill("Belvedere demo");
  await expect(page.getByText("Nessun luogo trovato", { exact: true })).toBeVisible();
});

test("staff confirms the same guest request in the same browser", async ({ page }) => {
  await loginAsGuest(page);
  await createCapreseOrder(page);

  await page.getByRole("button", { name: "Esci" }).click();
  await loginAsAdmin(page);
  await expectNoHorizontalOverflow(page);

  const requestListItem = page.getByRole("button", { name: /Panino caprese/ }).first();
  await expect(requestListItem).toContainText("In attesa");
  await requestListItem.click();

  await page.getByLabel("Stato richiesta").selectOption("confirmed");
  await page.getByLabel("Nota dello staff").fill("Confermato per le 12:30.");
  await page.getByRole("button", { name: "Salva aggiornamento" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Richiesta aggiornata" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Panino caprese/ }).first()).toContainText(
    "Confermato",
  );

  await page.getByRole("main").getByRole("button", { name: "Esci" }).click();
  await loginAsGuest(page);

  const guestRequest = page
    .getByRole("region", { name: "Le tue richieste" })
    .getByRole("article")
    .filter({ hasText: "Panino caprese" });
  await expect(guestRequest.getByText("Confermato", { exact: true })).toBeVisible();
  await expect(guestRequest).toContainText("Confermato per le 12:30.");
});

test("staff creates credentials, resets a password and adds a catalog item", async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByRole("tab", { name: "Soggiorni" }).click();
  await page.getByRole("button", { name: "Nuovo soggiorno" }).click();

  const stayDialog = page.getByRole("dialog", { name: "Nuovo soggiorno" });
  await expectDialogIsTopmost(page, "Nuovo soggiorno");
  await stayDialog.getByLabel("Cognome").fill("Bianchi");
  await stayDialog.getByLabel("Nome visualizzato").fill("Famiglia Bianchi");
  await stayDialog.getByLabel("Camera").fill("Camera demo");
  await stayDialog.getByLabel("Ospiti").fill("3");
  await stayDialog.getByLabel("Lingua ospite").selectOption("de");
  await stayDialog.getByRole("button", { name: "Crea accesso" }).click();

  const credentialDialog = page.getByRole("dialog", {
    name: "Credenziali del nuovo soggiorno",
  });
  await expect(credentialDialog).toContainText(/BIANCHI-\d{2}/);
  await expect(credentialDialog).toContainText("Password temporanea");
  await credentialDialog.getByRole("button", { name: "Ho copiato, chiudi" }).click();

  await expect(page.getByRole("heading", { level: 3, name: "Famiglia Bianchi" })).toBeVisible();
  await page.getByRole("button", { name: "Reimposta password" }).click();
  const resetDialog = page.getByRole("dialog", { name: /Nuova password/ });
  await expect(resetDialog).toContainText("Password temporanea");
  await resetDialog.getByRole("button", { name: "Ho copiato, chiudi" }).click();

  await page.getByRole("tab", { name: "Shop" }).click();
  await expect(page.getByRole("tab", { name: "Attività" })).toBeVisible();
  await page.getByRole("button", { name: "Aggiungi prodotto" }).click();
  const productDialog = page.getByRole("dialog", { name: "Nuovo prodotto" });
  await expectDialogIsTopmost(page, "Nuovo prodotto");
  await productDialog.getByLabel("Italiano", { exact: true }).fill("Aperitivo della casa");
  await productDialog.getByLabel("English", { exact: true }).fill("House aperitivo");
  await productDialog.getByLabel("Deutsch", { exact: true }).fill("Aperitif des Hauses");
  await productDialog.getByLabel("Русский", { exact: true }).fill("Домашний аперитив");
  await productDialog.getByLabel("Prezzo (€)").fill("18.50");
  await productDialog.getByRole("button", { name: "Aggiungi allo Shop" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Aperitivo della casa" })).toBeVisible();
  await expect(page.getByText(/18,50\s*€/).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("main").getByRole("button", { name: "Esci" }).click();
  await loginAsGuest(page);
  await expect(page.getByText("Aperitivo della casa", { exact: true })).toBeVisible();
});
