import Link from "next/link";
import { ImageGallery } from "@/components/gallery/image-gallery";
import { SiteShell } from "@/components/layout/site-shell";
import { MapReveal } from "@/components/location/map-reveal";
import { ArrowIcon } from "@/components/ui/icons";
import { getLocalizedPath } from "@/lib/content/routes";
import { siteIdentity } from "@/lib/content/site";
import type { FeaturePageContent, SiteContent } from "@/lib/content/types";
import { CtaSection } from "./cta-section";
import { PageBodyLayout } from "./page-body-layout";
import { PageHero } from "./page-hero";

type FeaturePageProps = {
  content: SiteContent;
  page: FeaturePageContent;
};

export function FeaturePage({ content, page }: FeaturePageProps) {
  const isLocation = page.route === "location";

  return (
    <SiteShell content={content}>
      <main id="main-content">
        <PageHero image={page.heroImage} intro={page.intro} />

        <PageBodyLayout
          contentClassName="rich-copy"
          label={page.intro.eyebrow ?? "La Fenice"}
        >
          {page.sections.map((section) => (
            <section className="content-section" id={section.id} key={section.id}>
              {section.eyebrow ? <span className="eyebrow">{section.eyebrow}</span> : null}
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.cta ? (
                <Link className="button-link" href={getLocalizedPath(section.cta.route, content.locale)}>
                  {section.cta.label}
                  <ArrowIcon />
                </Link>
              ) : null}
            </section>
          ))}
          {page.note ? (
            <div className="review-notice">
              <strong>{content.common.goodToKnow}</strong>
              <p>{page.note}</p>
            </div>
          ) : null}
        </PageBodyLayout>

        {isLocation ? (
          <MapReveal
            description={`${siteIdentity.address.formatted}. ${content.common.mapLoadingNotice}`}
            directionsLabel={content.common.getDirections}
            image={page.heroImage}
            openLabel={content.common.openMap}
            title={content.common.openMap}
          />
        ) : null}

        {page.gallery.length > 1 ? (
          <ImageGallery
            images={page.gallery}
            labels={{
              title: content.common.viewGallery,
              previous: content.common.previousImage,
              next: content.common.nextImage,
              close: content.common.closeGallery,
            }}
          />
        ) : null}

        <CtaSection content={content} />
      </main>
    </SiteShell>
  );
}
