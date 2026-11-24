# Task T007 — Call to Action Banner

Status: Ready  
Backlog Item: B010  
Created: 2026-11-24  
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

Create a full-width call-to-action banner that invites visitors to take an action, for
example "Get in touch" or "Start your trial". It shows an authored heading, a short body,
and one or two action buttons (primary and optional secondary). Authors choose the
banner's background from a fixed set of design-system colours, and can optionally add a
background image that replaces the colour. The banner is placed in the `headless-main`
placeholder, and its content is authored in a datasource item stored in the site's
`Data` folder, so one banner can be reused on several pages.

---

## Related Artifacts

Feature Specification: `harness/artifacts/specs/T007-feature-spec.md`  
Design Note: `harness/artifacts/design/T007-design-note.md`  
Implementation Plan: `harness/artifacts/plans/T007-implementation-plan.md`  
QA Review: `harness/artifacts/qa/T007-qa-review.md`  
CMS Configuration Record: `harness/artifacts/cms-config/T007-cms-config.md`  
Run Report: `harness/runs/T007-run-report.md`

---

## Scope

### In Scope

- A **Call to Action Banner** rendering, registered through the existing component map,
  that renders:
  - a heading (Sitecore **Single-Line Text** field)
  - body text (Sitecore **Rich Text** field), short-form, optional
  - a primary action (Sitecore **General Link** field), styled as the primary button
  - an optional secondary action (Sitecore **General Link** field), styled as the
    secondary button; not rendered when empty
  - a background colour chosen from a fixed set of design-system colour options
    (Sitecore **Droplink** field pointing to background-colour option items), with a
    sensible default when none is selected
  - an optional background image (Sitecore **Image** field). When set, it replaces the
    colour background and keeps the text readable (e.g. with a scrim).
- Full-width layout that spans the viewport, with content constrained to the
  design-system content width, and responsive behaviour across breakpoints (buttons stack
  on small viewports).
- Experience Editor / Pages editing support for every field, including empty optional
  fields.
- Accessibility: semantic heading, buttons that are real links with discernible text,
  visible focus states, and text-to-background contrast that meets WCAG AA for every
  colour option and with a background image.
- Sitecore items: the datasource template with the fields above; the background-colour
  option template, its options folder, and one option item per allowed colour; the
  rendering, made available on the `harness-engineering` site and allowed in
  `headless-main`; a datasource folder under the site's `Data` folder; and sample
  content (at least one banner with both buttons and one with a background image) placed
  on a page for verification.
- Unit/component tests covering: all fields populated; secondary action absent; body
  absent; each background mode (colour option, default colour, image); and empty fields
  in editing mode.
- CMS configuration of all of the above through the CMS Configuration stage, with
  serialization coverage.

### Out of Scope

- More than two action buttons, or buttons with icons.
- Free-form colour selection (hex values, colour pickers) or per-banner custom colours
  outside the fixed design-system set.
- Video, animated, or parallax backgrounds.
- Layout variants (split image/text, left/right alignment options, narrow or card
  styles). The single full-width layout is the only design.
- Rendering parameters or style variants for the banner. All configuration is in
  datasource fields.
- Click tracking, analytics events, personalisation, or A/B testing of the banner.
- Dictionary-driven labels (B012) and localisation of authored content beyond what
  Sitecore item languages already provide.
- Changes to the Hero Banner component or sharing code with it beyond existing
  design-system utilities.
- Mock or fallback content when the CMS returns no data.

---

## Acceptance Criteria

Acceptance criteria will be finalised in the Feature Specification. The task must, at
minimum, deliver the following:

- The banner renders the authored heading, body, and primary action from its datasource
  in the `headless-main` placeholder, spanning the full viewport width.
- The secondary action renders only when its General Link field is set. The body
  renders only when its Rich Text field has content.
- The background is the selected colour option, falls back to the default colour when no
  option is selected, and shows the background image instead whenever one is set.
- Text meets WCAG AA contrast against every allowed colour option and over a background
  image.
- Every field is editable in Pages, including empty optional fields.
- The CMS Configuration Record shows the templates, option items, rendering,
  availability, placeholder settings, datasource folder, and sample content created and
  verified, and serialization covers every path.
- Tests cover the cases listed in scope, and the existing suite still passes.

---

## Dependencies

- `headless-main` placeholder and the default Page Design from T001.
- Design-system colour, typography, spacing, and button tokens (`ui-design-system`
  skill). The allowed background colours must come from these tokens.
- The Droplink-to-option-items pattern established by T004 (`OverlayOpacityOption`),
  for the background-colour options.
- The existing `harness-engineering` rendering category and serialization includes for
  templates, renderings, placeholder settings, content, and media.
- For the background-image sample content: an image in
  `/sitecore/media library/Project/harness-engineering`. Upload it before the CMS stage,
  or the record will list it as a Manual Step.

---

## Risks

- **Contrast.** Each allowed colour option, and the image-with-scrim case, needs a
  checked foreground colour. A colour option with no AA-compliant text colour must be
  dropped from the set rather than shipped.
- **Overlap with the Hero Banner.** Both have a background image and a link. Spec and
  Design need to keep the CTA banner visually distinct and its purpose clear, without
  coupling the two components.
- **Editing mode.** Empty optional links and the image-versus-colour switch must stay
  editable in Pages. A background image the author can't see or select in edit mode is a
  common failure.
- **Option items in the CMS.** The Droplink source query must resolve site-relatively
  (`$site`, with `#`-escaped segments). The option items must exist before the datasource
  template field that references them.
- **First run of the D-005 CMS stage.** The CMS agent now builds on `create_component`,
  which puts the rendering and its templates in the Feature layer
  (`Feature/harness-engineering`). Two behaviours are untested, and the agent escalates
  rather than working around them: whether `create_component` without `modelId` creates
  the `<Name> Folder` template and datasource folder, and whether `update_component`
  sets the rendering's Datasource Template. The CMS Configuration Record and write log
  need a careful review at Awaiting Approval. The editing host won't run this branch
  during the CMS stage, so the visual check will be "not deployed — not verifiable",
  with the layout JSON as the main check.

---

## Task Notes

- This is a **re-run from scratch**. The first attempt (2026-11-24) was abandoned, its CMS
  items were reverted, and its branch was deleted, after it showed that the CMS stage
  should build on `create_component` rather than rebuild its output (harness decisions
  D-004 and D-005, commits `000eca2` and `cd6c213`). It was chosen because it exercises a
  new datasource template, several field types (Single-Line Text, Rich Text, General
  Link, Droplink, Image), option items, availability, placeholder settings, and sample
  content, without being large.
- The run happens on `feature/T007-call-to-action-banner`, branched from
  `dev-mcp-adoption`, not from `main`.
- **Binding human decision: colours** (made in the first attempt). The project has no
  colour tokens (`globals.css` has no `@theme` and no colour variables). Use Tailwind's
  default palette, which existing components already use, and never `primary` utilities
  (no `primary` colour is defined):

  | Option | Background | Text |
  |---|---|---|
  | Neutral Light (default) | `neutral-100` | `neutral-900` |
  | Primary | `blue-700` | `white` |
  | Neutral Dark | `neutral-900` | `white` |
  | Background image | black scrim | `white` |

  - Buttons on Primary, Neutral Dark, and image backgrounds: primary = white fill with
    `neutral-900` label; secondary = white outline with white label. On Neutral Light:
    primary = `neutral-900` fill with white label; secondary = `neutral-900` outline.
    This is a banner-level decision, not a new design-system pattern.
  - The scrim over a background image is black (Design sets the opacity for AA).
  - The Background Colour field gets author help text saying the image overrides the
    colour.
- Open questions for the Specification and Design stages: whether the primary action is
  required or optional; the heading level (likely `<h2>`, since the page's `<h1>` belongs
  elsewhere); and the scrim opacity.

---

## Approval

Reviewer: Rob  
Decision: Approved  
Notes:
