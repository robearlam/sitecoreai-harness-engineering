import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GalleryCarousel from "../galleryCarousel";
import type { GalleryImageItem } from "../imageGalleryTypes";

jest.mock("@sitecore-content-sdk/nextjs", () => {
  type FieldProp = { value?: string | { src?: string; alt?: string } };
  return {
    NextImage: ({
      field,
      className,
    }: {
      field?: FieldProp;
      className?: string;
    }) => {
      const v = field?.value as { src?: string; alt?: string } | undefined;
      return v?.src ? (
        <img src={v.src} alt={v.alt ?? ""} className={className} />
      ) : null;
    },
    Text: ({
      field,
      tag: Tag = "span",
      id,
      className,
    }: {
      field?: FieldProp;
      tag?: string;
      id?: string;
      className?: string;
    }) =>
      React.createElement(
        Tag,
        { id, className, "data-editable": "true" },
        field?.value as string,
      ),
  };
});

function makeItem(n: number, caption: string): GalleryImageItem {
  return {
    id: `item-${n}`,
    fields: {
      Image: {
        value: {
          src: `/img-${n}.jpg`,
          alt: `Alt ${n}`,
          width: 800,
          height: 600,
        },
      },
      Caption: { value: caption },
    },
  };
}

function makeItems(count: number, captioned = true): GalleryImageItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeItem(i + 1, captioned ? `Caption ${i + 1}` : ""),
  );
}

describe("GalleryCarousel", () => {
  it("exposes a labelled carousel region and one visible slide", () => {
    render(<GalleryCarousel items={makeItems(3)} />);
    const region = screen.getByRole("region", { name: "Image gallery" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const slides = screen.getAllByRole("group", { name: /Slide \d of 3/ });
    expect(slides).toHaveLength(1);
    expect(slides[0]).toHaveAccessibleName("Slide 1 of 3");
    expect(screen.getByRole("img", { name: "Alt 1" })).toBeVisible();
    expect(
      screen.queryByRole("img", { name: "Alt 2" }),
    ).not.toBeInTheDocument();
  });

  it("names the region from the heading when present", () => {
    render(
      <>
        <h2 id="h">My gallery</h2>
        <GalleryCarousel
          items={makeItems(2)}
          headingText="My gallery"
          headingId="h"
        />
      </>,
    );
    expect(
      screen.getByRole("region", { name: "My gallery" }),
    ).toBeInTheDocument();
  });

  it("shows next and previous slides with wrap-around", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByRole("img", { name: "Alt 3" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("img", { name: "Alt 1" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("img", { name: "Alt 2" })).toBeVisible();
  });

  it("jumps via indicators and exposes the current one", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(4)} />);
    expect(screen.getAllByRole("button", { name: /Go to slide/ })).toHaveLength(
      4,
    );
    expect(
      screen.getByRole("button", { name: "Go to slide 1" }),
    ).toHaveAttribute("aria-current", "true");
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(screen.getByRole("img", { name: "Alt 3" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Go to slide 3" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Go to slide 1" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("navigates with arrow keys while focus is inside, wrapping", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    screen.getByRole("button", { name: /View image full size: Alt 1/ }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("img", { name: "Alt 3" })).toBeVisible();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("img", { name: "Alt 1" })).toBeVisible();
  });

  it("announces user-initiated changes only", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(status).toHaveTextContent("Slide 2 of 3. Caption 2");
  });

  it("shows the current position", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });

  it("shows the caption of the current slide only to assistive technology", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(2)} />);
    const exposed = () =>
      screen
        .queryAllByText(/^Caption \d$/)
        .filter((el) => !el.closest('[aria-hidden="true"]'))
        .map((el) => el.textContent);
    expect(exposed()).toEqual(["Caption 1"]);
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(exposed()).toEqual(["Caption 2"]);
  });

  it("renders no caption text when no slide has a caption", () => {
    const { container } = render(
      <GalleryCarousel items={makeItems(2, false)} />,
    );
    expect(container.querySelector("p")).toHaveTextContent("1 of 2");
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders no controls or indicators for a single image", () => {
    render(<GalleryCarousel items={makeItems(1)} />);
    expect(
      screen.queryByRole("button", { name: "Next slide" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous slide" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Go to slide/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View image full size/ }),
    ).toBeInTheDocument();
  });

  it("does not react to arrow keys with a single image", () => {
    render(<GalleryCarousel items={makeItems(1)} />);
    const trigger = screen.getByRole("button", {
      name: /View image full size/,
    });
    fireEvent.keyDown(trigger, { key: "ArrowRight" });
    expect(
      within(screen.getByRole("region")).getByRole("img", { name: "Alt 1" }),
    ).toBeVisible();
  });
});
