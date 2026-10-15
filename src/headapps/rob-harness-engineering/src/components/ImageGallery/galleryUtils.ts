/** Wrap-around navigation helpers and grouped English labels (dictionary-ready, see B012). */

export function nextIndex(current: number, count: number): number {
  if (count <= 0) return 0;
  return (current + 1) % count;
}

export function previousIndex(current: number, count: number): number {
  if (count <= 0) return 0;
  return (current - 1 + count) % count;
}

export const galleryLabels = {
  gallery: "Image gallery",
  previous: "Previous slide",
  next: "Next slide",
  close: "Close",
  carouselRoleDescription: "carousel",
  slideRoleDescription: "slide",
  slide: (position: number, count: number): string =>
    `Slide ${position} of ${count}`,
  image: (position: number, count: number): string =>
    `Image ${position} of ${count}`,
  goToSlide: (position: number): string => `Go to slide ${position}`,
  triggerName: (
    alt: string | undefined,
    position: number,
    count: number,
  ): string =>
    alt?.trim()
      ? `View image full size: ${alt.trim()}`
      : `View image ${position} of ${count} full size`,
};
