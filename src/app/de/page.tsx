import { HomePage } from "@/components/pages/home-page";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/page-metadata";

export const metadata = buildMetadata("de", "home");

export default function GermanHomePage() {
  return <HomePage content={getContent("de")} />;
}
