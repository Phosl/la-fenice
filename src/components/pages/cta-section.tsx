import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import { getLocalizedPath } from "@/lib/content/routes";
import type { Locale } from "@/lib/content/types";

type CtaSectionProps = {
  locale: Locale;
};

export function CtaSection({ locale }: CtaSectionProps) {
  const copy =
    locale === "it"
      ? {
          eyebrow: "Il tuo soggiorno",
          title: "Inizia da una richiesta, con calma.",
          text: "Indica le date e il numero di ospiti. La Fenice risponderà direttamente con disponibilità e dettagli.",
          label: "Richiedi disponibilità",
        }
      : {
          eyebrow: "Your stay",
          title: "Begin with a simple request.",
          text: "Share your dates and number of guests. La Fenice will reply directly with availability and details.",
          label: "Request availability",
        };

  return (
    <section className="cta-section">
      <div className="container cta-section__inner">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 className="section-title">{copy.title}</h2>
        <p>{copy.text}</p>
        <Link className="button-primary" href={getLocalizedPath("availability", locale)}>
          {copy.label}
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
