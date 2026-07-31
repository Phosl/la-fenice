import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import { getLocalizedPath } from "@/lib/content/routes";
import type { SiteContent } from "@/lib/content/types";

type CtaSectionProps = {
  content: SiteContent;
};

export function CtaSection({ content }: CtaSectionProps) {
  const copy = content.availabilityCta;

  return (
    <section className="cta-section">
      <div className="container cta-section__inner">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 className="section-title">{copy.title}</h2>
        <p>{copy.text}</p>
        <Link className="button-primary" href={getLocalizedPath("availability", content.locale)}>
          {copy.label}
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
