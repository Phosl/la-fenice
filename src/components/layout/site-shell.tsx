import { buildNavigation } from "@/lib/content/navigation";
import type { SiteContent } from "@/lib/content/types";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type SiteShellProps = {
  children: React.ReactNode;
  content: SiteContent;
  overlayHeader?: boolean;
};

export function SiteShell({ children, content, overlayHeader = true }: SiteShellProps) {
  const navigation = buildNavigation(content.locale, content.navigation);

  return (
    <>
      <SiteHeader
        changeLanguageLabel={content.common.changeLanguage}
        closeMenuLabel={content.common.closeMenu}
        locale={content.locale}
        navigation={navigation}
        openMenuLabel={content.common.openMenu}
        overlay={overlayHeader}
      />
      {children}
      <SiteFooter content={content} navigation={navigation} />
    </>
  );
}
