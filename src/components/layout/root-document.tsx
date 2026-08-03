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

const introNoScriptFallback = `
.logo-intro {
  animation: intro-shell-nojs 1680ms cubic-bezier(.2, .72, .2, 1) both !important;
}
`;

type RootDocumentProps = {
  children: React.ReactNode;
  content: SiteContent;
};

export function RootDocument({ children, content }: RootDocumentProps) {
  return (
    <html data-scroll-behavior="smooth" lang={content.locale} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: introBootstrap }} />
        <noscript>
          <style>{introNoScriptFallback}</style>
        </noscript>
        <a className="skip-link" href="#main-content">
          {content.common.skipToContent}
        </a>
        <LogoIntro controls={content.common.introControls} />
        {children}
      </body>
    </html>
  );
}
