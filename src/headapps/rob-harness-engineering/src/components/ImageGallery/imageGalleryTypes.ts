import type { Field, ImageField, Page } from "@sitecore-content-sdk/nextjs";

export interface GalleryImageFields {
  Image?: ImageField;
  Caption?: Field<string>;
}

export interface GalleryImageItem {
  id: string;
  fields: GalleryImageFields;
}

export interface ImageGalleryFields {
  Heading?: Field<string>;
  Images?: GalleryImageItem[];
}

export interface ImageGalleryProps {
  fields?: ImageGalleryFields;
  page: Page;
}
