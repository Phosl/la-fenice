import Image from "next/image";
import { ArrowIcon } from "@/components/ui/icons";
import { siteIdentity } from "@/lib/content/site";
import type { HomePageContent } from "@/lib/content/types";

export function HomeExperiences({ page }: { page: HomePageContent }) {
  const experiences = page.experiences;

  return (
    <section aria-labelledby="home-experiences-title" className="home-experiences">
      <div className="container">
        <div className="home-experiences__heading">
          <span className="eyebrow">{experiences.eyebrow}</span>
          <h2 className="section-title" id="home-experiences-title">
            {experiences.title}
          </h2>
          <p>{experiences.lead}</p>
        </div>

        <div className="home-experiences__grid">
          {experiences.items.map((experience, index) => {
            const href = `mailto:${siteIdentity.email}?subject=${encodeURIComponent(experience.emailSubject)}&body=${encodeURIComponent(experience.emailBody)}`;

            return (
              <article className="experience-card" key={experience.id}>
                <div className="experience-card__media">
                  <Image
                    alt={experience.image.alt}
                    fill
                    sizes="(max-width: 820px) 100vw, 33vw"
                    src={experience.image.src}
                  />
                  <span aria-hidden="true" className="experience-card__number">
                    0{index + 1}
                  </span>
                </div>
                <div className="experience-card__copy">
                  <h3>{experience.title}</h3>
                  <p>{experience.text}</p>
                  <a className="button-link" href={href}>
                    {experiences.requestLabel}
                    <ArrowIcon />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
