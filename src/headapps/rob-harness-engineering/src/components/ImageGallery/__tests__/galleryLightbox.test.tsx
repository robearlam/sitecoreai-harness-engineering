import React from "react";
import { render, screen } from "@testing-library/react";
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

const openTrigger = () =>
  screen.getByRole("button", { name: /View image full size/ });

describe("Gallery lightbox", () => {
  it("opens from the trigger as a named modal dialog with focus on Close", async () => {
    const user = userEvent.setup();
    render(
      <GalleryCarousel
        items={makeItems(3)}
        headingText="Heading"
        headingId="h"
      />,
    );
    await user.click(openTrigger());
    const dialog = screen.getByRole("dialog", { name: "Caption 1" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(screen.getByText("Image 1 of 3")).toBeInTheDocument();
  });

  it("opens with the keyboard", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(2)} />);
    openTrigger().focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("falls back to the heading, then a generic name, for the dialog name", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <GalleryCarousel items={makeItems(2, false)} headingText="Heading" />,
    );
    await user.click(openTrigger());
    expect(screen.getByRole("dialog", { name: "Heading" })).toBeInTheDocument();
    unmount();
    render(<GalleryCarousel items={makeItems(2, false)} />);
    await user.click(openTrigger());
    expect(
      screen.getByRole("dialog", { name: "Image gallery" }),
    ).toBeInTheDocument();
  });

  it("contains Tab and Shift+Tab within the dialog", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    await user.click(openTrigger());
    const dialogButtons = ["Close", "Previous slide", "Next slide"];
    const dialog = screen.getByRole("dialog");
    const names = () =>
      dialogButtons.filter((n) =>
        dialog.contains(
          screen
            .getAllByRole("button", { name: n })
            .find((b) => b === document.activeElement) ?? null,
        ),
      );
    expect(names()).toEqual(["Close"]);
    await user.tab();
    await user.tab();
    expect(
      screen
        .getAllByRole("button", { name: "Next slide" })
        .includes(document.activeElement as HTMLElement),
    ).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(openTrigger());
  });

  it("navigates with buttons and arrow keys, wrapping", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    await user.click(openTrigger());
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("Image 3 of 3")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Image 1 of 3")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    await user.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "Next slide",
      ) as HTMLElement,
    );
    expect(screen.getByText("Image 2 of 3")).toBeInTheDocument();
  });

  it("shows no navigation for a single image", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(1)} />);
    await user.click(openTrigger());
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelectorAll("button")).toHaveLength(1);
    expect(screen.getByText("Image 1 of 1")).toBeInTheDocument();
  });

  it("closes with Close, Escape, and a backdrop click, but not on content clicks", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(2)} />);

    await user.click(openTrigger());
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(openTrigger());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(openTrigger());
    const dialog = screen.getByRole("dialog");
    await user.click(
      screen.getAllByRole("img", { name: "Alt 1" }).pop() as HTMLElement,
    );
    await user.click(screen.getAllByText("Caption 1").pop() as HTMLElement);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the last-viewed image and returns focus to its trigger on close", async () => {
    const user = userEvent.setup();
    render(<GalleryCarousel items={makeItems(3)} />);
    await user.click(openTrigger());
    await user.keyboard("{ArrowRight}{ArrowRight}");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View image full size: Alt 3/ }),
    ).toHaveFocus();
  });

  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "auto";
    render(<GalleryCarousel items={makeItems(2)} />);
    await user.click(openTrigger());
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("auto");
  });

  it("releases scroll lock when unmounted while open", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "";
    const { unmount } = render(<GalleryCarousel items={makeItems(2)} />);
    await user.click(openTrigger());
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
