import { NotFoundView } from "@/components/pages/not-found-view";
import { getContent } from "@/lib/content";

export default function GermanNotFound() {
  return <NotFoundView content={getContent("de")} />;
}
