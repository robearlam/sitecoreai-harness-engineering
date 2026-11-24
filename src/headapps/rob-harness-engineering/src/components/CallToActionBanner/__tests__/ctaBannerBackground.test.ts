import { resolveBackground } from "../ctaBannerBackground";
import type { BackgroundOptionItem } from "../callToActionBannerTypes";

const option = (value?: string): BackgroundOptionItem => ({
  id: "1",
  name: "x",
  fields: value === undefined ? {} : { Value: { value } },
});
const image = { value: { src: "/bg.jpg", alt: "bg" } };

describe("resolveBackground", () => {
  it.each(["neutral-light", "primary", "neutral-dark"])(
    "image overrides the %s option",
    (v) => {
      const r = resolveBackground(image, option(v));
      expect(r.mode).toBe("image");
      expect(r.hasScrim).toBe(true);
    },
  );

  it.each(["neutral-light", "primary", "neutral-dark"])(
    "maps %s to its own mode",
    (v) => {
      const r = resolveBackground(undefined, option(v));
      expect(r.mode).toBe(v);
      expect(r.hasScrim).toBe(false);
    },
  );

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty object", {}],
    ["missing Value", option()],
    ["empty Value", option("")],
    ["unknown Value", option("Primary")],
  ])("falls back to neutral-light for %s", (_n, opt) => {
    expect(
      resolveBackground(undefined, opt as BackgroundOptionItem | null | undefined)
        .mode,
    ).toBe("neutral-light");
  });

  it("does not trigger image mode when the image has no src", () => {
    expect(
      resolveBackground({ value: { src: "" } }, option("primary")).mode,
    ).toBe("primary");
    expect(resolveBackground({ value: {} }, undefined).mode).toBe(
      "neutral-light",
    );
  });

  it("uses distinct button treatments for light and dark contexts", () => {
    const light = resolveBackground(undefined, option("neutral-light"));
    const dark = resolveBackground(undefined, option("primary"));
    expect(light.primaryButton).not.toBe(dark.primaryButton);
    expect(resolveBackground(image).primaryButton).toBe(dark.primaryButton);
    expect(resolveBackground(undefined, option("neutral-dark")).secondaryButton).toBe(
      dark.secondaryButton,
    );
  });
});
