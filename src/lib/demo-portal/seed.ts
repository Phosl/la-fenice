import { addDemoDays, getRomeToday, isDateWithinStay } from "./dates";
import { createGuideSeedCatalog } from "./guide-seed";
import { hashDemoPassword, normaliseLoginCode } from "./security";
import type {
  DemoCatalogItem,
  DemoLocalizedLabel,
  DemoPortalState,
  DemoProductCatalogItem,
} from "./types";
import { DEMO_PORTAL_VERSION } from "./types";

export const DEMO_GUEST_CREDENTIALS = {
  loginCode: "cliente",
  password: "cliente",
} as const;

export const DEMO_ADMIN_CREDENTIALS = {
  loginCode: "admin",
  password: "admin",
} as const;

const labels = (
  en: string,
  it: string,
  de: string,
  ru: string,
): DemoLocalizedLabel => ({ en, it, de, ru });

export function createDiningSeedCatalog(timestamp: string): DemoProductCatalogItem[] {
  const shared = { active: true, createdAt: timestamp, updatedAt: timestamp };
  return [
    {
      id: "product-daily-lunch",
      slug: "daily-lunch",
      kind: "product",
      category: "lunch",
      sortOrder: 0,
      labels: labels("Menu of the day", "Menu del giorno", "Tagesmenü", "Меню дня"),
      description: labels(
        "Request the daily lunch menu. The team will confirm the dishes, price, availability and time.",
        "Richiedi il menu del giorno per pranzo. Lo staff confermerà piatti, prezzo, disponibilità e orario.",
        "Fragen Sie das Tagesmenü zum Mittagessen an. Das Team bestätigt Gerichte, Preis, Verfügbarkeit und Uhrzeit.",
        "Запросите меню дня на обед. Команда подтвердит блюда, цену, наличие и время.",
      ),
      ...shared,
    },
    {
      id: "product-pizza-fenice",
      slug: "pizza-fenice",
      kind: "product",
      category: "dinner",
      sortOrder: 5,
      labels: labels("Pizza Fenice", "Pizza Fenice", "Pizza Fenice", "Pizza Fenice"),
      description: labels(
        "Request Pizza Fenice for the evening. The team will confirm the available options, price and time. This request is not a confirmed order.",
        "Richiedi Pizza Fenice per la sera. Lo staff confermerà le proposte disponibili, il prezzo e l’orario. La richiesta non è un ordine confermato.",
        "Fragen Sie Pizza Fenice für den Abend an. Das Team bestätigt die verfügbaren Varianten, den Preis und die Uhrzeit. Die Anfrage ist noch keine bestätigte Bestellung.",
        "Запросите Pizza Fenice на вечер. Команда подтвердит доступные варианты, цену и время. Запрос не является подтверждённым заказом.",
      ),
      ...shared,
    },
  ];
}

function createSeedCatalog(timestamp: string): DemoCatalogItem[] {
  const shared = { active: true, priceCents: undefined, createdAt: timestamp, updatedAt: timestamp };

  return [
    ...createDiningSeedCatalog(timestamp),
    { id: "product-caprese-sandwich", slug: "caprese-sandwich", kind: "product", category: "food", sortOrder: 10, labels: labels("Caprese sandwich", "Panino caprese", "Caprese-Sandwich", "Сэндвич «Капрезе»"), ...shared },
    { id: "product-tuna-tomato-sandwich", slug: "tuna-tomato-sandwich", kind: "product", category: "food", sortOrder: 20, labels: labels("Tuna and tomato sandwich", "Panino tonno e pomodoro", "Thunfisch-Tomaten-Sandwich", "Сэндвич с тунцом и помидорами"), ...shared },
    { id: "product-caprese", slug: "caprese", kind: "product", category: "food", sortOrder: 30, labels: labels("Caprese", "Caprese", "Caprese", "Капрезе"), ...shared },
    { id: "product-salad", slug: "salad", kind: "product", category: "food", sortOrder: 40, labels: labels("Salad", "Insalata", "Salat", "Салат"), ...shared },
    { id: "product-classic-drinks", slug: "classic-drinks", kind: "product", category: "classic-drink", sortOrder: 50, labels: labels("Classic drinks", "Bevande classiche", "Klassische Getränke", "Классические напитки"), ...shared },
    { id: "product-wines", slug: "wines", kind: "product", category: "wine", sortOrder: 60, labels: labels("Wines", "Vini", "Weine", "Вина"), ...shared },
    { id: "product-champagne", slug: "champagne", kind: "product", category: "champagne", sortOrder: 70, labels: labels("Champagne", "Champagne", "Champagner", "Шампанское"), ...shared },
    { id: "product-raw-fish", slug: "raw-fish", kind: "product", category: "raw-fish", sortOrder: 80, labels: labels("Raw fish selection", "Crudo di pesce", "Rohe Fischspezialitäten", "Ассорти из сырой рыбы"), ...shared },
    { id: "activity-fishing", slug: "fishing", kind: "activity", category: "fishing", sortOrder: 110, labels: labels("Fishing experience", "Esperienza di pesca", "Angelerlebnis", "Рыбалка"), ...shared },
    { id: "activity-boat-trip", slug: "boat-trip", kind: "activity", category: "boat-trip", sortOrder: 120, labels: labels("Boat trip", "Giro in barca", "Bootsausflug", "Прогулка на лодке"), ...shared },
    { id: "activity-lemon-grove", slug: "lemon-grove", kind: "activity", category: "lemon-grove", sortOrder: 130, labels: labels("Lemon grove visit", "Visita alla limonaia", "Besuch im Zitronengarten", "Посещение лимонного сада"), ...shared },
  ];
}

export async function createDemoPortalSeed(now = new Date()): Promise<DemoPortalState> {
  const today = getRomeToday(now);
  const timestamp = now.toISOString();
  const [guestPasswordHash, adminPasswordHash] = await Promise.all([
    hashDemoPassword(DEMO_GUEST_CREDENTIALS.password),
    hashDemoPassword(DEMO_ADMIN_CREDENTIALS.password),
  ]);

  return {
    version: DEMO_PORTAL_VERSION,
    revision: 1,
    accounts: [
      {
        id: "demo-guest-account",
        loginCode: normaliseLoginCode(DEMO_GUEST_CREDENTIALS.loginCode),
        passwordHash: guestPasswordHash,
        credentialVersion: 1,
        role: "guest",
        active: true,
        stayId: "demo-stay",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "demo-admin-account",
        loginCode: normaliseLoginCode(DEMO_ADMIN_CREDENTIALS.loginCode),
        passwordHash: adminPasswordHash,
        credentialVersion: 1,
        role: "admin",
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    stays: [
      {
        id: "demo-stay",
        accountId: "demo-guest-account",
        surname: "Rossi",
        guestName: "Famiglia Rossi",
        checkIn: addDemoDays(today, -2),
        checkOut: addDemoDays(today, 4),
        room: "Camera 3 · Terrazza mare",
        guests: 2,
        locale: "it",
        active: true,
        autoAnchorToToday: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    catalog: [...createSeedCatalog(timestamp), ...createGuideSeedCatalog(timestamp)],
    orders: [],
    activityRequests: [],
    guideRequests: [],
    updatedAt: timestamp,
  };
}

export function refreshDemoStayForToday(
  state: DemoPortalState,
  now = new Date(),
): DemoPortalState {
  const today = getRomeToday(now);
  const seedStay = state.stays.find((stay) => stay.id === "demo-stay");
  if (
    !seedStay ||
    !seedStay.autoAnchorToToday ||
    isDateWithinStay(seedStay, today)
  ) {
    return state;
  }
  const timestamp = now.toISOString();

  return {
    ...state,
    revision: state.revision + 1,
    stays: state.stays.map((stay) =>
      stay.id === seedStay.id
        ? {
            ...stay,
            checkIn: addDemoDays(today, -2),
            checkOut: addDemoDays(today, 4),
            active: true,
            updatedAt: timestamp,
          }
        : stay,
    ),
    orders: state.orders.filter((order) => order.stayId !== seedStay.id),
    activityRequests: state.activityRequests.filter(
      (request) => request.stayId !== seedStay.id,
    ),
    guideRequests: state.guideRequests.filter(
      (request) => request.stayId !== seedStay.id,
    ),
    updatedAt: timestamp,
  };
}
