import { buildNavigation } from "@/lib/content/navigation";
import { getContent } from "@/lib/content";
import { supportedLocales } from "@/lib/content/routes";
import type { Locale } from "@/lib/content/types";
import type { SiteContent } from "@/lib/content/types";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { PageTransition } from "./page-transition";

type SiteShellProps = {
  children: React.ReactNode;
  content: SiteContent;
  overlayHeader?: boolean;
};

export function SiteShell({ children, content, overlayHeader = true }: SiteShellProps) {
  const navigation = buildNavigation(content.locale, content.navigation);
  const languageNames = Object.fromEntries(
    supportedLocales.map((locale) => [locale, getContent(locale).common.languageName]),
  ) as Record<Locale, string>;

  return (
    <>
      <SiteHeader
        changeLanguageLabel={content.common.changeLanguage}
        closeMenuLabel={content.common.closeMenu}
        languageNames={languageNames}
        locale={content.locale}
        navigation={navigation}
        openMenuLabel={content.common.openMenu}
        overlay={overlayHeader}
        primaryNavigationLabel={content.common.primaryNavigation}
      />
      <PageTransition accent>{children}</PageTransition>
      <SiteFooter content={content} navigation={navigation} />
    </>
  );
}
