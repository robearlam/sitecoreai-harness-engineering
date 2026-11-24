import { useId } from "react";
import type { JSX } from "react";
import { Image, Link, RichText, Text } from "@sitecore-content-sdk/nextjs";
import type { LinkField } from "@sitecore-content-sdk/nextjs";
import type { CallToActionBannerProps } from "./callToActionBannerTypes";
import { resolveBackground } from "./ctaBannerBackground";

const EMPTY_LINK: LinkField = { value: {} };

export default function CallToActionBanner({
  fields,
  page,
}: CallToActionBannerProps): JSX.Element | null {
  const headingId = `cta-banner-heading-${useId()}`;

  if (!fields) return null;

  const isEditing = !!page?.mode?.isEditing;
  const look = resolveBackground(
    fields.BackgroundImage,
    fields.BackgroundColour,
  );
  const hasImage = look.mode === "image";

  const headingText = fields.Heading?.value?.toString().trim() ?? "";
  const bodyText = fields.Body?.value?.toString().trim() ?? "";
  const hasPrimary = !!fields.PrimaryAction?.value?.href;
  const hasSecondary = !!fields.SecondaryAction?.value?.href;

  const showHeading = isEditing || !!headingText;
  const showBody = isEditing || !!bodyText;
  const showPrimary = isEditing || hasPrimary;
  const showSecondary = isEditing || hasSecondary;

  return (
    <section
      className={`relative overflow-hidden py-12 md:py-16 ${look.band} ${look.text}`}
      aria-labelledby={showHeading ? headingId : undefined}
      data-background={look.mode}
    >
      {hasImage && (
        <>
          <div aria-hidden="true" className="absolute inset-0">
            <Image
              field={fields.BackgroundImage}
              alt=""
              editable={false}
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
        </>
      )}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
        {showHeading && (
          <Text
            field={fields.Heading}
            tag="h2"
            id={headingId}
            className="max-w-3xl text-3xl font-bold md:text-4xl"
          />
        )}
        {showBody && (
          <RichText
            field={fields.Body}
            className="max-w-2xl text-lg leading-relaxed [&_a]:text-inherit [&_a]:underline"
          />
        )}
        {(showPrimary || showSecondary) && (
          <div className="flex w-full max-w-sm flex-col gap-4 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
            {showPrimary && (
              <Link
                field={fields.PrimaryAction ?? EMPTY_LINK}
                className={look.primaryButton}
              />
            )}
            {showSecondary && (
              <Link
                field={fields.SecondaryAction ?? EMPTY_LINK}
                className={look.secondaryButton}
              />
            )}
          </div>
        )}
        {isEditing && (
          <div className="w-full max-w-sm">
            <p className="mb-2 text-sm font-medium">Background image</p>
            <Image
              field={fields.BackgroundImage}
              className="mx-auto h-auto max-h-32 w-auto"
            />
          </div>
        )}
      </div>
    </section>
  );
}
