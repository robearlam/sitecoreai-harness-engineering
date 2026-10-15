import type { ButtonHTMLAttributes, JSX, Ref } from "react";

export type GalleryIconName = "previous" | "next" | "close";

interface GalleryIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: GalleryIconName;
  label: string;
  onDark?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const paths: Record<GalleryIconName, string> = {
  previous: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  close: "M6 6l12 12M18 6L6 18",
};

export default function GalleryIconButton({
  icon,
  label,
  onDark = false,
  className = "",
  ...rest
}: GalleryIconButtonProps): JSX.Element {
  const tone = onDark
    ? "text-white hover:text-neutral-300 focus-visible:outline-white"
    : "text-neutral-700 hover:text-neutral-900 focus-visible:outline-primary";
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 ${tone} ${className}`}
      {...rest}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[icon]} />
      </svg>
    </button>
  );
}
