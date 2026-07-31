import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";
import type { Locale } from "@/lib/content/types";

export function NotFoundView({ locale }: { locale: Locale }) {
  const copy =
    locale === "it"
      ? {
          title: "Questo sentiero non arriva al mare.",
          text: "La pagina potrebbe essere stata spostata. Torna a La Fenice e riparti da lì.",
          button: "Torna alla home",
          href: "/it",
        }
      : {
          title: "This path does not reach the sea.",
          text: "The page may have moved. Return to La Fenice and continue from there.",
          button: "Back home",
          href: "/",
        };

  return (
    <main className="not-found" id="main-content">
      <LogoLockup />
      <span className="eyebrow">404</span>
      <h1 className="section-title">{copy.title}</h1>
      <p>{copy.text}</p>
      <Link className="button-primary" href={copy.href}>{copy.button}</Link>
    </main>
  );
}
