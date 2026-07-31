import { HomePage } from "@/components/pages/home-page";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/page-metadata";

export const metadata = buildMetadata("ru", "home");

export default function RussianHomePage() {
  return <HomePage content={getContent("ru")} />;
}
