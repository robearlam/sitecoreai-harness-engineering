import type { JSX } from "react";
import { Text } from "@sitecore-content-sdk/nextjs";
import type { ImageGalleryProps } from "./imageGalleryTypes";
import GalleryEditingList from "./galleryEditingList";
import GalleryCarousel from "./galleryCarousel";

const HEADING_ID = "image-gallery-heading";

export default function ImageGallery({
  fields,
  page,
}: ImageGalleryProps): JSX.Element | null {
  if (!fields) return null;

  const items = (fields.Images ?? []).filter((item) => !!item?.fields);
  const isEditing = !!page?.mode?.isEditing;
  const headingClass = "text-3xl font-bold text-neutral-900 md:text-4xl";

  if (isEditing) {
    return (
      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <Text field={fields.Heading} tag="h2" className={headingClass} />
          <GalleryEditingList items={items} />
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  const headingText = fields.Heading?.value?.toString().trim() ?? "";

  return (
    <section className="py-10 md:py-16">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {headingText && (
          <Text
            field={fields.Heading}
            tag="h2"
            id={HEADING_ID}
            className={headingClass}
          />
        )}
        <GalleryCarousel
          items={items}
          headingText={headingText || undefined}
          headingId={headingText ? HEADING_ID : undefined}
        />
      </div>
    </section>
  );
}
