"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX, KeyboardEvent } from "react";
import { NextImage } from "@sitecore-content-sdk/nextjs";
import type { GalleryImageItem } from "./imageGalleryTypes";
import { galleryLabels, nextIndex, previousIndex } from "./galleryUtils";
import GalleryIconButton from "./galleryIconButton";
import GalleryLightbox from "./galleryLightbox";

interface GalleryCarouselProps {
  items: GalleryImageItem[];
  headingText?: string;
  headingId?: string;
}

export default function GalleryCarousel({
  items,
  headingText,
  headingId,
}: GalleryCarouselProps): JSX.Element {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const refocusTrigger = useRef(false);
  const focusNewTrigger = useRef(false);
  const multiple = count > 1;

  useEffect(() => {
    if (!lightboxOpen && refocusTrigger.current) {
      refocusTrigger.current = false;
      triggerRefs.current[index]?.focus();
    }
  }, [lightboxOpen, index]);

  useEffect(() => {
    if (focusNewTrigger.current) {
      focusNewTrigger.current = false;
      triggerRefs.current[index]?.focus();
    }
  }, [index]);

  const goTo = (target: number): void => {
    setIndex(target);
    const caption = items[target]?.fields.Caption?.value;
    const base = galleryLabels.slide(target + 1, count);
    setAnnouncement(caption ? `${base}. ${caption}` : base);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (lightboxOpen || !multiple) return;
    const onTrigger = triggerRefs.current.some((el) => el === event.target);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusNewTrigger.current = onTrigger;
      goTo(nextIndex(index, count));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusNewTrigger.current = onTrigger;
      goTo(previousIndex(index, count));
    }
  };

  const closeLightbox = (lastViewed: number): void => {
    refocusTrigger.current = true;
    setIndex(lastViewed);
    setLightboxOpen(false);
  };

  const captions = items.map(
    (item) => item.fields.Caption?.value?.toString() ?? "",
  );
  const hasCaptions = captions.some(Boolean);

  return (
    <section
      aria-roledescription={galleryLabels.carouselRoleDescription}
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : galleryLabels.gallery}
      onKeyDown={handleKeyDown}
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-100 md:aspect-video">
        {items.map((item, i) => {
          const alt = item.fields.Image?.value?.alt?.toString();
          const current = i === index;
          return (
            <div
              key={item.id}
              role="group"
              aria-roledescription={galleryLabels.slideRoleDescription}
              aria-label={galleryLabels.slide(i + 1, count)}
              hidden={!current}
              className="absolute inset-0"
            >
              <button
                type="button"
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                aria-label={galleryLabels.triggerName(alt, i + 1, count)}
                onClick={() => setLightboxOpen(true)}
                className="relative block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <NextImage
                  field={item.fields.Image}
                  fill
                  sizes="(min-width: 1280px) 1280px, 100vw"
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  className="object-contain"
                />
              </button>
            </div>
          );
        })}
      </div>

      {hasCaptions && (
        <div className="mt-4 grid text-base text-neutral-600">
          {captions.map((caption, i) => (
            <p
              key={items[i].id}
              aria-hidden={i === index ? undefined : true}
              className={`col-start-1 row-start-1 ${i === index ? "" : "invisible"}`}
            >
              {caption}
            </p>
          ))}
        </div>
      )}

      {multiple && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <GalleryIconButton
            icon="previous"
            label={galleryLabels.previous}
            onClick={() => goTo(previousIndex(index, count))}
          />
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {items.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-label={galleryLabels.goToSlide(i + 1)}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => goTo(i)}
                  className="flex h-6 min-w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-2.5 rounded-full border ${
                      i === index
                        ? "w-6 border-primary bg-primary"
                        : "w-2.5 border-neutral-500 bg-transparent"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <GalleryIconButton
            icon="next"
            label={galleryLabels.next}
            onClick={() => goTo(nextIndex(index, count))}
          />
          <p className="w-full text-center text-sm text-neutral-600 md:w-auto md:text-left">
            {index + 1} of {count}
          </p>
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {lightboxOpen && (
        <GalleryLightbox
          items={items}
          startIndex={index}
          label={headingText}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}
