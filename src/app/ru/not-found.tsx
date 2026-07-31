import { NotFoundView } from "@/components/pages/not-found-view";
import { getContent } from "@/lib/content";

export default function RussianNotFound() {
  return <NotFoundView content={getContent("ru")} />;
}
