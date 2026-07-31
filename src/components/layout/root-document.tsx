import { LogoIntro } from "@/components/brand/logo-intro";
import type { Locale } from "@/lib/content/types";

const introBootstrap = `
try {
  if (sessionStorage.getItem("la-fenice-intro-seen") === "true") {
    document.documentElement.classList.add("intro-seen");
  }
} catch (_) {
  document.documentElement.dataset.introStorage = "unavailable";
}
`;

type RootDocumentProps = {
  children: React.ReactNode;
  locale: Locale;
};

export function RootDocument({ children, locale }: RootDocumentProps) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: introBootstrap }} />
        <a className="skip-link" href="#main-content">
          {locale === "it" ? "Vai al contenuto" : "Skip to content"}
        </a>
        <LogoIntro />
        {children}
      </body>
    </html>
  );
}
