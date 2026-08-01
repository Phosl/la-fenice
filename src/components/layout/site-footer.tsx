import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { InstagramIcon } from "@/components/ui/icons";
import { siteIdentity } from "@/lib/content/site";
import type { SiteContent } from "@/lib/content/types";
import type { NavigationModel } from "@/lib/content/navigation";

type SiteFooterProps = {
  content: SiteContent;
  navigation: NavigationModel;
};

export function SiteFooter({ content, navigation }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const instagram = siteIdentity.social.find(
    (item) => item.platform === "instagram",
  );

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <LogoLockup inverse />
            <p>{content.footer.description}</p>
            {instagram ? (
              <a
                className="site-footer__instagram"
                href={instagram.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <InstagramIcon />
                <span>{instagram.label}</span>
                <small>@lafenicepositano</small>
              </a>
            ) : null}
          </div>

          <div className="site-footer__columns">
            <div className="footer-column">
              <span className="footer-column__title">{content.footer.contactTitle}</span>
              <a href={`mailto:${siteIdentity.email}`}>{siteIdentity.email}</a>
              <a href={siteIdentity.phone.href}>{siteIdentity.phone.display}</a>
              <a href={siteIdentity.maps.place} rel="noopener noreferrer" target="_blank">
                {siteIdentity.address.formatted}
              </a>
            </div>
            <div className="footer-column">
              <span className="footer-column__title">{content.footer.exploreTitle}</span>
              {navigation.primary.slice(1).map((item) => (
                <Link href={item.href} key={item.route}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>
            © {year} {siteIdentity.legalName} · {content.common.vatNumber} {siteIdentity.vatNumber} · {content.footer.photographyCredit}
          </span>
          <span className="site-footer__legal">
            {navigation.utility.map((item) => (
              <Link href={item.href} key={item.route}>
                {item.label}
              </Link>
            ))}
            {siteIdentity.social
              .filter((item) => item.platform !== "instagram")
              .map((item) => (
                <a href={item.href} key={item.platform} rel="noopener noreferrer" target="_blank">
                  {item.label}
                </a>
              ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
