import React from "react";
import { render, screen } from "@testing-library/react";
import type { Page } from "@sitecore-content-sdk/nextjs";
import ImageGallery from "../ImageGallery";
import type { ImageGalleryFields } from "../imageGalleryTypes";
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

const normalPage = { mode: { isEditing: false } } as unknown as Page;
const editingPage = { mode: { isEditing: true } } as unknown as Page;

function setup(
  fields: ImageGalleryFields | undefined,
  page: Page = normalPage,
) {
  return render(<ImageGallery fields={fields} page={page} />);
}

describe("ImageGallery", () => {
  describe("normal mode", () => {
    it("renders an h2 heading and no other heading levels", () => {
      setup({ Heading: { value: "Our work" }, Images: makeItems(2) });
      expect(
        screen.getByRole("heading", { level: 2, name: "Our work" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("heading")).toHaveLength(1);
    });

    it("names the carousel from the heading", () => {
      setup({ Heading: { value: "Our work" }, Images: makeItems(2) });
      expect(
        screen.getByRole("region", { name: "Our work" }),
      ).toBeInTheDocument();
    });

    it("renders no heading element when the heading is empty", () => {
      setup({ Heading: { value: "" }, Images: makeItems(2) });
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: "Image gallery" }),
      ).toBeInTheDocument();
    });

    it("renders nothing with zero images, including no heading", () => {
      const { container } = setup({
        Heading: { value: "Our work" },
        Images: [],
      });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when the Images field is missing", () => {
      const { container } = setup({ Heading: { value: "Our work" } });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when fields are undefined", () => {
      const { container } = setup(undefined);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("editing mode", () => {
    it("shows every image and caption in authored order with no interactive controls", () => {
      const { container } = setup(
        { Heading: { value: "Our work" }, Images: makeItems(3) },
        editingPage,
      );
      expect(
        screen.getByRole("heading", { level: 2, name: "Our work" }),
      ).toBeInTheDocument();
      const images = screen.getAllByRole("img");
      expect(images.map((i) => i.getAttribute("alt"))).toEqual([
        "Alt 1",
        "Alt 2",
        "Alt 3",
      ]);
      images.forEach((i) => expect(i).toBeVisible());
      expect(screen.getByText("Caption 1")).toBeVisible();
      expect(screen.getByText("Caption 3")).toBeVisible();
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
      expect(container.querySelectorAll("[hidden]")).toHaveLength(0);
    });

    it("renders an empty caption as an editable field", () => {
      const { container } = setup(
        { Heading: { value: "Our work" }, Images: makeItems(2, false) },
        editingPage,
      );
      expect(
        container.querySelectorAll('p[data-editable="true"]'),
      ).toHaveLength(2);
    });

    it("still renders the editable heading when empty with zero images", () => {
      const { container } = setup(
        { Heading: { value: "" }, Images: [] },
        editingPage,
      );
      expect(container.querySelector("h2")).toBeInTheDocument();
    });
  });
});
