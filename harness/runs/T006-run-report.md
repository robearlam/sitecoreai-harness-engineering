# Harness Run Report

## Task

Task ID: T006  
Task Title: Image Gallery Carousel with Lightbox  
Task File: harness/tasks/T006-image-gallery-carousel-with-lightbox.md

---

## Run

Run Report ID: T006-run-report  
Workflow Mode: Standard  
CMS Configuration: Required  
Branch: Feature/Lightbox-Carousel  
Base Commit: d46d260dee7fa966689b17ae1b38445f6683177e

---

## Stage History

### Initialization — 2026-10-14

Run initialized by /run-task on `Feature/Lightbox-Carousel` at base commit `d46d260dee7f`. Workflow mode: Standard. CMS Configuration: Required.

### Specification — RUN-2026-10-14-T006-SPEC — 2026-10-14

Outcome: Feature spec produced: 32 ACs; open questions resolved (fixed h2, wrap-around in carousel and lightbox, expanded non-interactive editing view). `verify-stage.sh spec` passed.

### Design — RUN-2026-10-14-T006-DESIGN — 2026-10-14

Outcome: Design note produced; h1 ownership and Multilist field resolution left unverified (outside Design's input contract), carried to Planning. `verify-stage.sh design` passed.

### Implementation Planning — RUN-2026-10-14-T006-PLAN — 2026-10-14

Outcome: Implementation plan produced; h1 ownership confirmed (Hero Banner), Multilist data via default layout data as T005; referenced-field editing metadata needs live check. `verify-stage.sh plan` passed.

### Build — RUN-2026-10-14-T006-BUILD — 2026-10-14

Outcome: Committed 2735474; lint pass, 81/81 tests pass (re-run by orchestrator); npm run build fails on missing Sitecore env config (pre-existing, environmental) — next build compile unverified. `verify-stage.sh build` passed.

### QA — RUN-2026-10-14-T006-QA — 2026-10-14

Returned to Build: QA blocking: arrow-key navigation loses focus to body after one press when focus is on the slide trigger (AC13)

---

## Artifact Paths

Feature Specification: harness/artifacts/specs/T006-feature-spec.md  
Design Note: harness/artifacts/design/T006-design-note.md  
Implementation Plan: harness/artifacts/plans/T006-implementation-plan.md  
QA Review: harness/artifacts/qa/T006-qa-review.md  
CMS Configuration Guide: harness/artifacts/cms-config/T006-cms-config.md

---

## Validation Evidence

Run ID: RUN-2026-10-14-T006-BUILD-2 (fix pass after QA)

### Implementation summary
Fixed the blocking QA finding on AC13. When focus is on a slide's "view full size" trigger and an arrow key changes the slide, focus now moves to the new slide's trigger (via a ref flag and an effect on `index`), so repeated arrow presses keep working in a real browser. Non-blocking findings were left alone, as instructed.

### Files changed
- src/headapps/rob-harness-engineering/src/components/ImageGallery/galleryCarousel.tsx
- src/headapps/rob-harness-engineering/src/components/ImageGallery/__tests__/galleryCarousel.test.tsx (regression test: new slide's trigger has focus after each arrow press)

### Validation commands
- `npm --prefix src/headapps/rob-harness-engineering run lint`: passed with no output errors. The script's unquoted glob misses src/components/, so it is not evidence for this component.
- `npx eslint src/components/ImageGallery` (run directly): 0 errors, 4 warnings, all unchanged and not from this fix (3x @next/next/no-img-element in test mocks, 1 unused eslint-disable directive in galleryLightbox.tsx).
- `npm --prefix src/headapps/rob-harness-engineering test`: 8 suites passed, 82 tests passed.
- `npm --prefix src/headapps/rob-harness-engineering run build`: failed in sitecore-tools:build (generateSites). Unverified, not a new failure.

### Pre-existing environment issues
`npm run build` fails because there is no .env.local ([MV-007]). It is environmental and unrelated to this task, so the build is recorded as unverified.

### Assumptions
Focus is only moved when the keydown target was one of the slide triggers, so pagination and arrow buttons keep their own focus.

### Blockers or follow-ups
Non-blocking QA findings #2-#8, the primary colour token and lightbox control placement are held for the human.

### Governance observations
None.

## Notes



- **Spec (carry-forward to Design):** the spec fixes the heading as `h2`. The Spec agent assumed the page `h1` is owned elsewhere (page or Hero Banner) but did not verify it. Design must confirm.
- **Spec (carry-forward to Design/Plan):** it is unverified that the Gallery Image fields referenced by the Multilist reach the layout data (AC28). Design/Plan must establish how they are resolved.
- **Spec (carry-forward to QA):** the accessibility criteria (focus trap, screen-reader announcements) need a manual keyboard and screen-reader pass; unit tests alone don't cover them.
- **Design:** neither Spec carry-forward could be verified, because doing so needs source reads outside Design's input contract. Both go to Planning as design-note Open Questions 1 and 2. Planning must confirm that (a) the page or Hero Banner provides the `h1`, and (b) the Promo Card Grid (T005) mechanism delivers Gallery Image fields with editing metadata (AC24, AC28).
- **Design (for the human, non-blocking):** the design system has no carousel, modal, lightbox, icon-button, backdrop or aspect-ratio guidance, so the design note proposes values for each. Adding them to the design system would be a harness change only the human can request.
- **Plan (h1, resolved):** Hero Banner renders the page `h1`, so the gallery's fixed `h2` stands. A page without a Hero Banner has no `h1`. That is a page-level gap, not a gallery defect, and QA should not raise it against T006.
- **Plan (AC28, resolved):** the gallery reads `fields.Images` from the default layout data through the default Rendering Contents Resolver, the same way Promo Card Grid (T005) does. No query is added.
- **Plan (AC24, carry-forward to QA/CMS):** it is **unverified** whether XM Cloud Pages sends editing metadata for fields on referenced items. Promo Card Grid renders those fields as raw `.value`, so it is no precedent. This needs a manual check on a live instance. If it fails, record it against AC24 for the human to decide. Build must not add a workaround query.
- **Plan (binding on Build):** the registered `ImageGallery` must be a server component, because `AppPlaceholder` passes `page` only to server components. Images use `NextImage`, not plain `Image` (AC6). The dialog is a hand-built `role="dialog"` overlay, chosen for testability in jsdom. Tests must not copy Promo Card Grid's CSS-class assertions.
- **Build (orchestrator check):** commit 2735474 exists. The orchestrator re-ran `npm test`: 8 suites and 81 tests pass.
- **Build (unverified, carry-forward to QA):** `npm run build` fails with `[MV-007]` because there is no `.env.local`. That is environmental and pre-existing, not caused by T006. As a result, the `next build` compile of the gallery is **unverified**. `tsc --noEmit` shows only the pre-existing `.sitecore/sites.json` errors.
- **Build (human/manual checks still open):**
  - AC24 inline editing of referenced fields in Pages
  - a keyboard and screen-reader pass
  - in-browser layout stability (fixed ratio, caption height)
  - image lazy loading and the full-size rendition in the lightbox
- **Housekeeping:** the uncommitted `harness/backlog/backlog.md` change is from `/new-task` (B011 → Ready for Spec, B006 → Done). It is not Build's and is left for the human to commit.
- **Correctness pass:** `/code-review high` over `d46d260..HEAD` returned 9 findings, all passed to QA.
  - **Confirmed blocking (1):** #1, arrow-key focus loss (AC13).
  - **Confirmed non-blocking (7):** #2–#8.
  - **Rejected (1):** #9, the live-region and visible captions derive from the same value.
- **QA round 1:** Issues Found, with one blocking issue (#1). Back to Build with only #1 as the fix list. Findings #2, #4 and #5 are cheap but non-blocking, so they stay with the human. They are not folded in unless the human asks.
- **QA finding (pre-existing, tooling):** the `lint` script's unquoted glob is expanded by `/bin/sh` without recursive matching and misses every file under `src/components/`. So "lint passes" has never covered components, here or in CI. Candidate separate tooling task. For T006, Build is asked to run ESLint directly over `src/components/ImageGallery/` as evidence.
- **Candidate follow-up "Image Gallery hardening" (for the human):**
  - Tailwind `primary` token missing (no `@theme`), so `bg-primary`, `border-primary` and `outline-primary` render nothing
  - lightbox image dimension guard (#3)
  - lightbox control placement on tablet and desktop
  - inert background behind the lightbox
  - captions through SDK `Text` (#7)
  - index clamp (#6)
  - shared test helper (#8)
  - duplicate heading id (#2), empty-image filter (#4), backdrop gap (#5) if not done now
