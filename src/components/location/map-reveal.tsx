"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { getImageFocusStyle } from "@/lib/content/image-focus";
import { siteIdentity } from "@/lib/content/site";
import type { GalleryImage } from "@/lib/content/types";

type MapRevealProps = {
  image: GalleryImage;
  openLabel: string;
  directionsLabel: string;
  title: string;
  description: string;
};

export function MapReveal({ image, openLabel, directionsLabel, title, description }: MapRevealProps) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="map-title" className="map-section">
      <div className="container">
        <div className="map-reveal">
          {open ? (
            <iframe
              allowFullScreen
              aria-label={title}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={siteIdentity.maps.embed}
              title={title}
            />
          ) : (
            <>
              <div className="map-reveal__preview">
                <Image
                  alt=""
                  className="editorial-image"
                  fill
                  sizes="(max-width: 820px) 100vw, 1220px"
                  src={image.src}
                  style={getImageFocusStyle(image)}
                />
              </div>
              <div className="map-reveal__content">
                <h2 id="map-title">{title}</h2>
                <p>{description}</p>
                <div className="map-reveal__actions">
                  <button className="button-primary" onClick={() => setOpen(true)} type="button">
                    {openLabel}
                    <ArrowIcon />
                  </button>
                  <a className="button-secondary" href={siteIdentity.maps.directions} rel="noopener noreferrer" target="_blank">
                    {directionsLabel}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
