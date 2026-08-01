"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CloseIcon, ExpandIcon } from "@/components/ui/icons";
import { getImageFocusStyle } from "@/lib/content/image-focus";
import type { GalleryImage } from "@/lib/content/types";

type GalleryLabels = {
  title: string;
  previous: string;
  next: string;
  close: string;
};

type ImageGalleryProps = {
  images: readonly GalleryImage[];
  labels: GalleryLabels;
};

export function ImageGallery({ images, labels }: ImageGalleryProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollTo = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(images.length - 1, index));
      const item = trackRef.current?.children[bounded] as HTMLElement | undefined;
      item?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setActiveIndex(bounded);
    },
    [images.length],
  );

  const closeLightbox = useCallback(() => {
    dialogRef.current?.close();
    setLightboxIndex(null);
  }, []);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    dialogRef.current?.showModal();
  };

  const moveLightbox = useCallback(
    (direction: -1 | 1) => {
      setLightboxIndex((current) => {
        if (current === null) return null;
        return (current + direction + images.length) % images.length;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
      if (event.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeLightbox, lightboxIndex, moveLightbox]);

  if (!images.length) return null;

  const lightboxImage = lightboxIndex === null ? null : images[lightboxIndex];

  return (
    <section aria-labelledby="gallery-title" className="gallery-section">
      <div className="container gallery-section__header">
        <div>
          <span className="eyebrow">La Fenice</span>
          <h2 className="section-title" id="gallery-title">
            {labels.title}
          </h2>
        </div>
        {images.length > 1 ? (
          <div className="gallery-controls">
            <button aria-label={labels.previous} disabled={activeIndex === 0} onClick={() => scrollTo(activeIndex - 1)} type="button">
              <ArrowIcon />
            </button>
            <button aria-label={labels.next} disabled={activeIndex === images.length - 1} onClick={() => scrollTo(activeIndex + 1)} type="button">
              <ArrowIcon />
            </button>
          </div>
        ) : null}
      </div>

      <ul className="gallery-track" ref={trackRef}>
        {images.map((image, index) => (
          <li className="gallery-item" key={image.id}>
            <figure>
              <button aria-label={`${labels.title}: ${image.alt}`} onClick={() => openLightbox(index)} type="button">
                <span className="gallery-item__image">
                  <Image
                    alt={image.alt}
                    className="editorial-image"
                    height={image.height}
                    sizes="(max-width: 560px) calc(100vw - 44px), (max-width: 1000px) 86vw, 760px"
                    src={image.src}
                    style={getImageFocusStyle(image)}
                    width={image.width}
                  />
                </span>
                <span className="gallery-item__expand">
                  <ExpandIcon />
                </span>
              </button>
              <figcaption>{image.caption ?? image.alt}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        aria-label={labels.title}
        className="lightbox"
        onClick={(event) => {
          if (event.currentTarget === event.target) closeLightbox();
        }}
        onClose={() => setLightboxIndex(null)}
        ref={dialogRef}
      >
        <button aria-label={labels.close} className="lightbox__close" onClick={closeLightbox} type="button">
          <CloseIcon />
        </button>
        {lightboxImage ? (
          <div className="lightbox__content">
            <figure className="lightbox__figure">
              <Image
                alt={lightboxImage.alt}
                height={lightboxImage.height}
                priority
                sizes="100vw"
                src={lightboxImage.src}
                width={lightboxImage.width}
              />
              <figcaption>
                {lightboxImage.caption ?? lightboxImage.alt} · {lightboxIndex! + 1}/{images.length}
              </figcaption>
            </figure>
            {images.length > 1 ? (
              <>
                <button aria-label={labels.previous} className="lightbox__nav lightbox__nav--prev" onClick={() => moveLightbox(-1)} type="button">
                  <ArrowIcon />
                </button>
                <button aria-label={labels.next} className="lightbox__nav lightbox__nav--next" onClick={() => moveLightbox(1)} type="button">
                  <ArrowIcon />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
