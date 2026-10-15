"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX, MouseEvent } from "react";
import { createPortal } from "react-dom";
import { NextImage } from "@sitecore-content-sdk/nextjs";
import type { GalleryImageItem } from "./imageGalleryTypes";
import { galleryLabels, nextIndex, previousIndex } from "./galleryUtils";
import GalleryIconButton from "./galleryIconButton";

interface GalleryLightboxProps {
  items: GalleryImageItem[];
  startIndex: number;
  label?: string;
  onClose: (lastViewedIndex: number) => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function GalleryLightbox({
  items,
  startIndex,
  label,
  onClose,
}: GalleryLightboxProps): JSX.Element | null {
  const count = items.length;
  const multiple = count > 1;
  const [index, setIndex] = useState(startIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current(indexRef.current);
      } else if (event.key === "ArrowRight" && count > 1) {
        event.preventDefault();
        setIndex((i) => nextIndex(i, count));
      } else if (event.key === "ArrowLeft" && count > 1) {
        event.preventDefault();
        setIndex((i) => previousIndex(i, count));
      } else if (event.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (!dialogRef.current?.contains(active)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [count]);

  const item = items[index];
  const caption = item?.fields.Caption?.value?.toString() ?? "";
  const name = caption || label || galleryLabels.gallery;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (
      (event.target as HTMLElement).closest("[data-lightbox-content], button")
    )
      return;
    onClose(index);
  };

  if (typeof document === "undefined" || !item) return null;

  return createPortal(
    // Backdrop click is a pointer convenience; keyboard users close with Escape or the Close button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 md:p-8"
    >
      <GalleryIconButton
        ref={closeRef}
        icon="close"
        label={galleryLabels.close}
        onDark
        onClick={() => onClose(index)}
        className="absolute right-2 top-2 md:right-4 md:top-4"
      />
      <figure
        data-lightbox-content
        className="flex max-h-full max-w-full flex-col items-center"
      >
        <NextImage
          field={item.fields.Image}
          sizes="100vw"
          className="h-auto max-h-[70vh] w-auto max-w-full object-contain"
        />
        {caption && (
          <figcaption className="mt-4 max-w-prose text-center text-base text-white">
            {caption}
          </figcaption>
        )}
      </figure>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-sm text-neutral-300"
        data-lightbox-content
      >
        {galleryLabels.image(index + 1, count)}
      </p>
      {multiple && (
        <div className="mt-2 flex gap-4 md:static">
          <GalleryIconButton
            icon="previous"
            label={galleryLabels.previous}
            onDark
            onClick={() => setIndex((i) => previousIndex(i, count))}
          />
          <GalleryIconButton
            icon="next"
            label={galleryLabels.next}
            onDark
            onClick={() => setIndex((i) => nextIndex(i, count))}
          />
        </div>
      )}
    </div>,
    document.body,
  );
}
