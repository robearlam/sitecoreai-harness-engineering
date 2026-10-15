# Task T006 — Image Gallery Carousel with Lightbox

Status: Ready  
Backlog Item: B011  
Created: 2026-10-14  
Workflow: Standard  
CMS Configuration: Required

<!--
Workflow: Standard runs every stage. Lightweight skips Design — use it only for
tasks with no new UI surface and no design decisions (config, CI, data).
CMS Configuration: Required when the task adds or changes a Sitecore-rendered
component; Not Required otherwise (e.g. CI or tooling work).
Create tasks with /new-task rather than copying this file by hand.
-->

---

## Summary

Create an Image Gallery rendering that presents a set of authored images as a carousel,
one slide at a time, with previous/next controls and slide indicators. Selecting the
current slide opens that image full-size in a lightbox overlay, where the visitor can
step through the rest of the gallery and close back to the carousel. The gallery is
placed in the `headless-main` placeholder. Authors create an Image Gallery data source
with an optional heading and a Multilist of Gallery Image items, each holding an image
and an optional caption.

---

## Related Artifacts

Feature Specification: `harness/artifacts/specs/T006-feature-spec.md`  
Design Note: `harness/artifacts/design/T006-design-note.md`  
Implementation Plan: `harness/artifacts/plans/T006-implementation-plan.md`  
QA Review: `harness/artifacts/qa/T006-qa-review.md`  
CMS Configuration Guide: `harness/artifacts/cms-config/T006-cms-config.md`  
Run Report: `harness/runs/T006-run-report.md`

---

## Scope

### In Scope

- Implement the **Image Gallery** rendering with:
  - An optional authored heading (Sitecore Single-Line Text field). When empty, no
    heading is rendered.
  - A carousel showing one image at a time, ordered as authored in the Multilist.
  - Previous and next controls, and slide indicators showing the current position that
    can also be used to jump to a slide.
  - Keyboard operation of the carousel (controls reachable and operable by keyboard;
    arrow keys move between slides when the carousel has focus).
  - Optional caption shown with each slide.
  - Responsive layout across design-system breakpoints, with a consistent slide aspect
    ratio so the page does not shift as slides change.
  - Images rendered from the Sitecore Image field with Next.js Image optimisation.
- Implement the **Lightbox** behaviour:
  - Activating the current slide opens a modal overlay showing that image at full size
    with its caption.
  - Previous/next navigation inside the lightbox across the whole gallery.
  - Closing via a visible close control, the Escape key, and clicking the backdrop.
  - Accessible modal behaviour: dialog semantics, focus moved into the lightbox on open,
    focus kept inside while open, focus returned to the triggering slide on close, and
    page scroll locked while open.
- Behaviour with few images: a single image renders without carousel controls or
  indicators (lightbox still available); no images renders nothing in normal mode.
- Experience Editor / Pages editing support: the heading, images, and captions remain
  editable, and the gallery stays usable for authors in editing mode.
- Create a data source template for the **Image Gallery** with:
  - Heading — Single-Line Text.
  - Images — Multilist referencing Gallery Image items.
- Create a data source template for the **Gallery Image** with:
  - Image — Image.
  - Caption — Single-Line Text.
- Register the Image Gallery rendering through the existing `sitecore-tools` component
  map and as an available rendering for the `headless-main` placeholder.
- Provide unit/component tests covering: multiple images, a single image, no images,
  caption present and absent, heading present and absent, carousel navigation (controls,
  indicators, keyboard), and lightbox open/navigate/close including focus return.
- Provide a CMS Configuration Guide covering the templates, rendering definition,
  placeholder settings / available renderings, data source creation, Multilist source
  configuration, and serialization steps.

### Out of Scope

- A grid or thumbnail-strip layout for the gallery (carousel is the only layout).
- Autoplay or automatic slide rotation.
- Showing more than one slide at a time, or configurable slides-per-view.
- Swipe/touch-gesture navigation beyond what native controls provide.
- Zoom, pan, or pinch-to-zoom within the lightbox.
- Deep-linking to a slide or lightbox image via URL.
- Video or other non-image media in the gallery.
- Download, share, or social actions on images.
- Selecting media library items directly in the Multilist (images are referenced
  through Gallery Image items).
- Per-instance variants or configurable transitions/animations beyond a basic slide
  change.
- Changes to existing components (Hero Banner, Promo Card Grid).
- New npm dependencies (no third-party carousel or lightbox library).
- Mock or fallback content when CMS data is unavailable.

---

## Acceptance Criteria

Acceptance criteria will be finalised in the Feature Specification. The task must, at
minimum, deliver the following:

- The Image Gallery renders the authored images in Multilist order as a carousel in the
  `headless-main` placeholder, one slide at a time, with the authored heading when set.
- Previous/next controls and indicators move between slides and are fully operable by
  keyboard, with visible focus states and accessible names.
- Captions render with their slide when authored and are omitted when empty.
- A single-image gallery renders no carousel controls or indicators; an empty gallery
  renders nothing in normal mode.
- Activating a slide opens the lightbox at that image; the lightbox supports
  previous/next, and closes via close control, Escape, and backdrop click.
- The lightbox traps focus while open, returns focus to the triggering slide on close,
  and locks page scroll while open.
- Images are rendered through the Sitecore Image field with Next.js Image optimisation
  and meaningful `alt` text from the image item.
- Heading, images, and captions are editable in Sitecore editing mode.
- The rendering is registered in the component map and available in `headless-main`,
  and the CMS Configuration Guide covers both data source templates.
- Component tests cover the cases listed in In Scope, and lint, tests, and build pass.

---

## Dependencies

- `headless-main` placeholder and the Default Page Design (T001).
- Existing `sitecore-tools` component map registration pattern.
- Design-system tokens for colour, spacing, typography, breakpoints, and focus states
  (`ui-design-system` skill).
- Promo Card Grid (T005) as the precedent for a Multilist of referenced data source
  items.
- Authored Gallery Image items with images in the Media Library for manual testing.

---

## Risks

- **Client/server boundary**: carousel and lightbox state needs client components; the
  split between server-rendered markup and interactive parts should keep the client
  surface small.
- **Editing mode**: a modal lightbox and hidden slides can make images and captions hard
  to reach in Experience Editor / Pages; the spec should define how the gallery behaves
  while editing (e.g. all slides reachable, lightbox disabled).
- **Accessibility**: carousels are a common WCAG failure point — slide announcements,
  control labelling, and focus management in the modal need explicit criteria.
- **Hard-coded UI strings**: control labels ("Previous", "Next", "Close", "Slide x of
  y") will be hard-coded until B012 introduces dictionary-driven labels.
- **Performance**: loading full-size images for every slide and the lightbox up front
  could be heavy; image sizing and lazy loading need a deliberate approach.
- **Layout shift**: images of differing aspect ratios may cause the carousel to jump
  unless the slide frame and image fit are specified.
- **Multilist resolution**: referenced Gallery Image fields must be resolved in the
  layout data for the rendering to read them.

---

## Task Notes

B011 was deferred pending design direction between a grid and a carousel. The human
chose a carousel with a lightbox on 2026-10-14 (work is on the `Feature/Lightbox-Carousel`
branch); grid layout is explicitly out of scope.

Open questions for the Specification stage:

- Whether the optional heading should be a fixed heading level or configurable.
- Whether the lightbox should wrap from last to first image (and the carousel likewise).
- How the gallery should present in editing mode.

---

## Approval

Reviewer: Rob Earlam  
Decision: Approved  
Notes:
