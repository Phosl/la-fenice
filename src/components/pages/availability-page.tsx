import { AvailabilityForm } from "@/components/availability/availability-form";
import { SiteShell } from "@/components/layout/site-shell";
import type { SiteContent } from "@/lib/content/types";
import { PageHero } from "./page-hero";

type AvailabilityPageProps = {
  content: SiteContent;
};

export function AvailabilityPage({ content }: AvailabilityPageProps) {
  const page = content.pages.availability;

  return (
    <SiteShell content={content}>
      <main id="main-content">
        <PageHero image={page.heroImage} intro={page.intro} />
        <section className="page-body">
          <div className="container">
            <AvailabilityForm locale={content.locale} page={page} />
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
