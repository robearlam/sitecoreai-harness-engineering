import type { JSX } from "react";
import { NextImage, Text } from "@sitecore-content-sdk/nextjs";
import type { GalleryImageItem } from "./imageGalleryTypes";

interface GalleryEditingListProps {
  items: GalleryImageItem[];
}

export default function GalleryEditingList({
  items,
}: GalleryEditingListProps): JSX.Element {
  return (
    <div className="space-y-8">
      {items.map((item) => (
        <div key={item.id}>
          <div className="relative aspect-[4/3] w-full bg-neutral-100 md:aspect-video">
            <NextImage
              field={item.fields.Image}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <Text
            field={item.fields.Caption}
            tag="p"
            className="mt-4 text-base text-neutral-600"
          />
        </div>
      ))}
    </div>
  );
}
