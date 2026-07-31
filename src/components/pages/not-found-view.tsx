import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { getLocalizedPath } from "@/lib/content/routes";
import type { SiteContent } from "@/lib/content/types";

export function NotFoundView({ content }: { content: SiteContent }) {
  const copy = content.notFound;

  return (
    <main className="not-found" id="main-content">
      <LogoLockup />
      <span className="eyebrow">404</span>
      <h1 className="section-title">{copy.title}</h1>
      <p>{copy.text}</p>
      <Link className="button-primary" href={getLocalizedPath("home", content.locale)}>{copy.button}</Link>
    </main>
  );
}
