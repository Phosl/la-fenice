import { SiteShell } from "@/components/layout/site-shell";
import type { LegalPageContent, SiteContent } from "@/lib/content/types";

type LegalPageProps = {
  content: SiteContent;
  page: LegalPageContent;
};

export function LegalPage({ content, page }: LegalPageProps) {
  return (
    <SiteShell content={content} overlayHeader={false}>
      <main className="legal-page" id="main-content">
        <section className="page-body">
          <div className="container legal-content__inner">
            <div className="rich-copy legal-copy">
              <h1 className="section-title">{page.title}</h1>
              <div className="review-notice">
                <strong>{page.reviewNotice.title}</strong>
                <p>{page.reviewNotice.text}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
