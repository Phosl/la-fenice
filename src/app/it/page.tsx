import { HomePage } from "@/components/pages/home-page";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/page-metadata";

export const metadata = buildMetadata("it", "home");

export default function ItalianHomePage() {
  return <HomePage content={getContent("it")} />;
}
