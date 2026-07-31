import { SiteShell } from "@/components/layout/site-shell";
import { ChevronIcon } from "@/components/ui/icons";
import type { SiteContent } from "@/lib/content/types";
import { CtaSection } from "./cta-section";
import { PageBodyLayout } from "./page-body-layout";
import { PageHero } from "./page-hero";

type GettingHerePageProps = {
  content: SiteContent;
};

export function GettingHerePage({ content }: GettingHerePageProps) {
  const page = content.pages.gettingHere;
  const officialLabel = content.common.officialWebsite;

  return (
    <SiteShell content={content}>
      <main id="main-content">
        <PageHero image={page.heroImage} intro={page.intro} />
        <PageBodyLayout label={page.intro.eyebrow ?? "La Fenice"}>
          <p className="lead">{page.travelNotice}</p>
          <div className="directions-grid">
            {page.modes.map((mode, index) => (
              <details className="direction-card" key={mode.id} open={index === 0}>
                <summary>
                  <span className="direction-card__number">0{index + 1}</span>
                  <span className="direction-card__title">{mode.title}</span>
                  <span className="direction-card__chevron"><ChevronIcon /></span>
                </summary>
                <div className="direction-card__content">
                  {mode.routes.map((route) => (
                    <section key={route.id}>
                      <h3>{route.title}</h3>
                      <ol>
                        {route.steps.map((step) => <li key={step}>{step}</li>)}
                      </ol>
                    </section>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <section className="official-resources">
            <span className="eyebrow">{page.officialResourcesTitle}</span>
            <div className="official-resources__grid">
              {page.officialResources.map((resource) => (
                <a href={resource.href} key={resource.id} rel="noopener noreferrer" target="_blank">
                  <strong>{resource.label}</strong>
                  <span>{resource.description}</span>
                  <small>{officialLabel} ↗</small>
                </a>
              ))}
            </div>
            <div className="review-notice">
              <strong>{page.transferTitle}</strong>
              <p>{page.transferNote}</p>
            </div>
          </section>
        </PageBodyLayout>
        <CtaSection content={content} />
      </main>
    </SiteShell>
  );
}
