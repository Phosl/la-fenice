import { LogoIntro } from "@/components/brand/logo-intro";
import type { SiteContent } from "@/lib/content/types";

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
  content: SiteContent;
};

export function RootDocument({ children, content }: RootDocumentProps) {
  return (
    <html lang={content.locale} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: introBootstrap }} />
        <a className="skip-link" href="#main-content">
          {content.common.skipToContent}
        </a>
        <LogoIntro skipLabel={content.common.skipIntro} />
        {children}
      </body>
    </html>
  );
}
