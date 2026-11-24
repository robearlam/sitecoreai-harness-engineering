import type { ImageField } from "@sitecore-content-sdk/nextjs";
import type { BackgroundOptionItem } from "./callToActionBannerTypes";

export type BackgroundMode =
  | "neutral-light"
  | "primary"
  | "neutral-dark"
  | "image";

export interface BackgroundPresentation {
  mode: BackgroundMode;
  band: string;
  text: string;
  primaryButton: string;
  secondaryButton: string;
  hasScrim: boolean;
}

const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center rounded px-6 py-3 text-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

const LIGHT_CONTEXT = {
  primaryButton: `${BUTTON_BASE} bg-neutral-900 text-white hover:bg-neutral-700 focus-visible:outline-neutral-900`,
  secondaryButton: `${BUTTON_BASE} border-2 border-neutral-900 bg-transparent text-neutral-900 hover:bg-neutral-900/10 focus-visible:outline-neutral-900`,
};

const DARK_CONTEXT = {
  primaryButton: `${BUTTON_BASE} bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:outline-white`,
  secondaryButton: `${BUTTON_BASE} border-2 border-white bg-transparent text-white hover:bg-white/10 focus-visible:outline-white`,
};

const PRESENTATIONS: Record<BackgroundMode, BackgroundPresentation> = {
  "neutral-light": {
    mode: "neutral-light",
    band: "bg-neutral-100",
    text: "text-neutral-900",
    hasScrim: false,
    ...LIGHT_CONTEXT,
  },
  primary: {
    mode: "primary",
    band: "bg-blue-700",
    text: "text-white",
    hasScrim: false,
    ...DARK_CONTEXT,
  },
  "neutral-dark": {
    mode: "neutral-dark",
    band: "bg-neutral-900",
    text: "text-white",
    hasScrim: false,
    ...DARK_CONTEXT,
  },
  image: {
    mode: "image",
    band: "bg-neutral-900",
    text: "text-white",
    hasScrim: true,
    ...DARK_CONTEXT,
  },
};

const COLOUR_KEYS: readonly BackgroundMode[] = [
  "neutral-light",
  "primary",
  "neutral-dark",
];

export function resolveBackground(
  image?: ImageField | null,
  option?: BackgroundOptionItem | null,
): BackgroundPresentation {
  if (image?.value?.src) return PRESENTATIONS.image;

  const value = option?.fields?.Value?.value;
  const key = COLOUR_KEYS.find((k) => k === value);
  return PRESENTATIONS[key ?? "neutral-light"];
}
