import { notFound } from "next/navigation";
import type { Locale, RouteKey } from "@/lib/content/types";
import { getContent } from "@/lib/content";
import { AvailabilityPage } from "./availability-page";
import { FeaturePage } from "./feature-page";
import { GettingHerePage } from "./getting-here-page";
import { LegalPage } from "./legal-page";

type RoutePageProps = {
  locale: Locale;
  route: RouteKey;
};

export function RoutePage({ locale, route }: RoutePageProps) {
  const content = getContent(locale);

  switch (route) {
    case "rooms":
    case "pool":
    case "privateBeach":
    case "gardenTable":
    case "location":
      return <FeaturePage content={content} page={content.pages[route]} />;
    case "gettingHere":
      return <GettingHerePage content={content} />;
    case "availability":
      return <AvailabilityPage content={content} />;
    case "privacy":
    case "terms":
      return <LegalPage content={content} page={content.pages[route]} />;
    default:
      notFound();
  }
}
