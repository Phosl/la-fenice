import { HomePage } from "@/components/pages/home-page";
import { getContent } from "@/lib/content";
import { buildMetadata } from "@/lib/page-metadata";

export const metadata = buildMetadata("en", "home");

export default function Page() {
  return <HomePage content={getContent("en")} />;
}
