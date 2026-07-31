import { getLocalizedPath } from "./routes";
import type { Locale, NavigationLabels, RouteKey } from "./types";

const primaryOrder = [
  "home",
  "rooms",
  "pool",
  "privateBeach",
  "gardenTable",
  "location",
  "gettingHere",
] as const satisfies readonly (keyof NavigationLabels["primary"])[];

const utilityOrder = ["privacy", "terms"] as const satisfies readonly (
  keyof NavigationLabels["utility"]
)[];

export interface NavigationLink {
  route: RouteKey;
  label: string;
  href: string;
}

export interface NavigationModel {
  primary: readonly NavigationLink[];
  utility: readonly NavigationLink[];
  availability: NavigationLink;
}

export const buildNavigation = (
  locale: Locale,
  labels: NavigationLabels,
): NavigationModel => ({
  primary: primaryOrder.map((route) => ({
    route,
    label: labels.primary[route],
    href: getLocalizedPath(route, locale),
  })),
  utility: utilityOrder.map((route) => ({
    route,
    label: labels.utility[route],
    href: getLocalizedPath(route, locale),
  })),
  availability: {
    route: "availability",
    label: labels.availability,
    href: getLocalizedPath("availability", locale),
  },
});
