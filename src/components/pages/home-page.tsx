import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowIcon } from "@/components/ui/icons";
import { getImageFocusStyle } from "@/lib/content/image-focus";
import { getLocalizedPath } from "@/lib/content/routes";
import { siteIdentity } from "@/lib/content/site";
import type { SiteContent } from "@/lib/content/types";
import { CtaSection } from "./cta-section";
import { HomeExperiences } from "./home-experiences";
import { SiteShell } from "@/components/layout/site-shell";

type HomePageProps = {
  content: SiteContent;
};

export function HomePage({ content }: HomePageProps) {
  const page = content.pages.home;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BedAndBreakfast",
    name: siteIdentity.name,
    url: siteIdentity.siteUrl,
    email: siteIdentity.email,
    telephone: siteIdentity.phone.display,
    logo: `${siteIdentity.siteUrl}/logo-la-fenice.svg`,
    image: `${siteIdentity.siteUrl}${page.hero.image.src}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteIdentity.address.street,
      postalCode: siteIdentity.address.postalCode,
      addressLocality: siteIdentity.address.locality,
      addressRegion: siteIdentity.address.region,
      addressCountry: siteIdentity.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteIdentity.coordinates.latitude,
      longitude: siteIdentity.coordinates.longitude,
    },
    sameAs: siteIdentity.social.map((item) => item.href),
  } as const;

  return (
    <SiteShell content={content}>
      <JsonLd data={structuredData} id="la-fenice-structured-data" />
      <main id="main-content">
        <section className="home-hero">
          <div className="home-hero__media">
            <Image
              alt={page.hero.image.alt}
              className="editorial-image"
              fill
              priority
              sizes="100vw"
              src={page.hero.image.src}
              style={getImageFocusStyle(page.hero.image)}
            />
          </div>
          <div className="container home-hero__content">
            <span className="eyebrow">{page.hero.eyebrow}</span>
            <h1 className="display-title">{page.hero.title}</h1>
            <div className="home-hero__intro">
              <p>{page.hero.lead}</p>
              <Link className="button-primary" href={getLocalizedPath(page.hero.primaryCta.route, content.locale)}>
                {page.hero.primaryCta.label}
                <ArrowIcon />
              </Link>
            </div>
          </div>
          <span className="scroll-cue">{page.locationTeaser.scrollLabel}</span>
        </section>

        <section className="intro-section">
          <div className="container intro-section__grid">
            <span className="eyebrow">{page.introduction.eyebrow}</span>
            <div className="intro-section__copy">
              <h2 className="section-title">{page.introduction.title}</h2>
              <div className="intro-section__body">
                {page.introduction.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
          </div>
        </section>

        <section className="story-flow">
          <div className="container">
            <div className="story-flow__heading">
              <div>
                <span className="eyebrow">{page.storyHeading.eyebrow}</span>
                <h2 className="section-title">{page.storyHeading.title}</h2>
              </div>
            </div>

            {page.stories.map((story) => (
              <article className="story-card" key={story.id}>
                <div className="story-card__media">
                  <Image
                    alt={story.image.alt}
                    className="editorial-image"
                    fill
                    sizes="(max-width: 820px) 100vw, 58vw"
                    src={story.image.src}
                    style={getImageFocusStyle(story.image)}
                  />
                </div>
                <div className="story-card__copy">
                  <span className="eyebrow">{story.eyebrow}</span>
                  <h3 className="section-title">{story.title}</h3>
                  <p>{story.text}</p>
                  <Link className="button-link" href={getLocalizedPath(story.cta.route, content.locale)}>
                    {story.cta.label}
                    <ArrowIcon />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <HomeExperiences page={page} />

        <section className="location-tease">
          <div className="container location-tease__grid">
            <div className="location-tease__copy">
              <span className="eyebrow">{page.locationTeaser.eyebrow}</span>
              <h2 className="section-title">{page.locationTeaser.title}</h2>
              <p>{page.locationTeaser.text}</p>
              <aside className="location-tease__accessibility">
                <strong>{page.stepsNotice.title}</strong>
                <p>{page.stepsNotice.text}</p>
              </aside>
              <Link className="button-link" href={getLocalizedPath("location", content.locale)}>
                {page.locationTeaser.linkLabel}
                <ArrowIcon />
              </Link>
            </div>
            <div className="location-tease__media">
              <Image
                alt={page.introduction.image?.alt ?? "La Fenice Positano"}
                className="editorial-image"
                fill
                sizes="(max-width: 820px) 100vw, 58vw"
                src={page.introduction.image?.src ?? page.hero.image.src}
                style={getImageFocusStyle(page.introduction.image ?? page.hero.image)}
              />
            </div>
          </div>
        </section>

        <CtaSection content={content} />
      </main>
    </SiteShell>
  );
}
