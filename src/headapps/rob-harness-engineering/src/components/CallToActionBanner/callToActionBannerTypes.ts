import type {
  Field,
  ImageField,
  LinkField,
  Page,
  RichTextField,
} from "@sitecore-content-sdk/nextjs";

/** Resolved Droplink item as delivered by the Layout Service. */
export interface BackgroundOptionItem {
  id?: string;
  name?: string;
  fields?: {
    Value?: Field<string>;
  };
}

export interface CallToActionBannerFields {
  Heading?: Field<string>;
  Body?: RichTextField;
  PrimaryAction?: LinkField;
  SecondaryAction?: LinkField;
  BackgroundColour?: BackgroundOptionItem | null;
  BackgroundImage?: ImageField;
}

export interface CallToActionBannerProps {
  fields?: CallToActionBannerFields;
  page: Page;
  rendering?: { uid?: string };
}
