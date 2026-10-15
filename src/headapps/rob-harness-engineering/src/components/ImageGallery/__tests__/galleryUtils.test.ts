import { galleryLabels, nextIndex, previousIndex } from "../galleryUtils";

describe("galleryUtils", () => {
  it("wraps next from last to first", () => {
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 3)).toBe(1);
  });

  it("wraps previous from first to last", () => {
    expect(previousIndex(0, 3)).toBe(2);
    expect(previousIndex(2, 3)).toBe(1);
  });

  it("stays on the only item and handles an empty list", () => {
    expect(nextIndex(0, 1)).toBe(0);
    expect(previousIndex(0, 1)).toBe(0);
    expect(nextIndex(0, 0)).toBe(0);
    expect(previousIndex(0, 0)).toBe(0);
  });

  it("builds position labels", () => {
    expect(galleryLabels.slide(2, 5)).toBe("Slide 2 of 5");
    expect(galleryLabels.image(2, 5)).toBe("Image 2 of 5");
    expect(galleryLabels.goToSlide(3)).toBe("Go to slide 3");
  });

  it("names the trigger from alt, falling back to position when alt is empty", () => {
    expect(galleryLabels.triggerName("A cat", 1, 3)).toBe(
      "View image full size: A cat",
    );
    expect(galleryLabels.triggerName("", 2, 3)).toBe(
      "View image 2 of 3 full size",
    );
    expect(galleryLabels.triggerName(undefined, 2, 3)).toBe(
      "View image 2 of 3 full size",
    );
  });
});
