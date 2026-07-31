import { NotFoundView } from "@/components/pages/not-found-view";
import { getContent } from "@/lib/content";

export default function NotFound() {
  return <NotFoundView content={getContent("en")} />;
}
