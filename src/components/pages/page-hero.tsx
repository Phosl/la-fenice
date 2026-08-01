import Image from "next/image";
import { getImageFocusStyle } from "@/lib/content/image-focus";
import type { GalleryImage, PageIntro } from "@/lib/content/types";

type PageHeroProps = {
  image: GalleryImage;
  intro: PageIntro;
};

export function PageHero({ image, intro }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero__media">
        <Image
          alt={image.alt}
          className="editorial-image"
          fill
          priority
          sizes="100vw"
          src={image.src}
          style={getImageFocusStyle(image)}
        />
      </div>
      <div className="container page-hero__content">
        {intro.eyebrow ? <span className="eyebrow">{intro.eyebrow}</span> : null}
        <h1 className="display-title">{intro.title}</h1>
        <p className="page-hero__intro">{intro.lead}</p>
      </div>
    </section>
  );
}
