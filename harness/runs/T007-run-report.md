# Harness Run Report

## Task

Task ID: T007  
Task Title: Call to Action Banner  
Task File: harness/tasks/T007-call-to-action-banner.md

---

## Run

Run Report ID: T007-run-report  
Workflow Mode: Standard  
CMS Configuration: Required  
Branch: feature/T007-call-to-action-banner  
Base Commit: cd6c2132190c9482de9fb8828c1ebee027bcd0a1

---

## Stage History

### Initialization — 2026-11-24

Run initialized by /run-task on `feature/T007-call-to-action-banner` at base commit `cd6c2132190c`. Workflow mode: Standard. CMS Configuration: Required.

### Specification — RUN-2026-11-24-T007-SPEC — 2026-11-24

Outcome: spec produced: 23 ACs; primary action required by convention, h2; scrim opacity, breakpoints, focus treatment passed to Design. `verify-stage.sh spec` passed.

### Design — RUN-2026-11-24-T007-DESIGN — 2026-11-24

Outcome: design note produced: 60% black scrim, sm stacking breakpoint, per-background focus ring, centred content; no blocking open questions. `verify-stage.sh design` passed.

### Implementation Planning — RUN-2026-11-24-T007-PLAN — 2026-11-24

Outcome: plan produced: single server component, 4 slices; CMS prerequisites per D-005 (no create_component items, no paths). `verify-stage.sh plan` passed.

### Build — RUN-2026-11-24-T007-BUILD — 2026-11-24

Outcome: implemented and committed fc43716; lint + 112 tests pass; production build unverified (MV-007). `verify-stage.sh build` passed.

### QA — RUN-2026-11-24-T007-QA — 2026-11-24

Outcome: Pass With Minor Issues; no blocking issues; 5 non-blocking findings; pre-existing lint-glob gap recorded. `verify-stage.sh qa` passed.

### CMS Configuration — RUN-2026-11-24-T007-CMS — 2026-11-24

Outcome: Complete: 25 logged writes, all items in Feature/harness-engineering via create_component; layout JSON verified; ser pull + icon check + deployed render check are Manual Steps. `verify-stage.sh cms` passed.

### Complete — 2026-11-24

Human reviewer approved completion.

---

## Artifact Paths

Feature Specification: harness/artifacts/specs/T007-feature-spec.md  
Design Note: harness/artifacts/design/T007-design-note.md  
Implementation Plan: harness/artifacts/plans/T007-implementation-plan.md  
QA Review: harness/artifacts/qa/T007-qa-review.md  
CMS Configuration Record: harness/artifacts/cms-config/T007-cms-config.md

---

## Validation Evidence

Run ID: RUN-2026-11-24-T007-BUILD (first Build pass)

### Implementation summary

Added `CallToActionBanner`, a server component, following the plan's four slices. A pure resolver (`resolveBackground`) is the single source of truth for background mode: a Background Image with a `src` gives image mode, otherwise `fields.Value.value` of the Droplink item matches `neutral-light`, `primary` or `neutral-dark`, and anything else falls back to neutral-light. The component renders a full-width labelled section with a `bg-black/60` scrim and a decorative image (empty alt, `aria-hidden`) in image mode. It renders a centred `max-w-7xl` container with an `h2`, a Rich Text body, and link buttons that stack below `sm`. The heading id is unique per instance through `useId`. In editing mode every field primitive is always rendered, and a labelled "Background image" slot is added. Normal mode omits empty body, heading and actions. The resolved mode is exposed as `data-background`. The component map was regenerated with `sitecore-tools:generate-map`, not hand-edited.

### Files changed

- `src/headapps/rob-harness-engineering/src/components/CallToActionBanner/CallToActionBanner.tsx` (new)
- `src/headapps/rob-harness-engineering/src/components/CallToActionBanner/callToActionBannerTypes.ts` (new)
- `src/headapps/rob-harness-engineering/src/components/CallToActionBanner/ctaBannerBackground.ts` (new)
- `src/headapps/rob-harness-engineering/src/components/CallToActionBanner/__tests__/ctaBannerBackground.test.ts` (new)
- `src/headapps/rob-harness-engineering/src/components/CallToActionBanner/__tests__/CallToActionBanner.test.tsx` (new)
- `src/headapps/rob-harness-engineering/.sitecore/component-map.ts` (regenerated)
- Harness files committed alongside: task file, backlog, spec, design note, plan, this run report.

### Validation commands

- `npm run lint`: passed, clean.
- `npm test`: passed, 10 suites and 112 tests (baseline 8 suites and 82 tests; this task adds 2 suites and 30 tests: 14 resolver, 16 component).
- `npm run sitecore-tools:generate-map`: passed. `CallToActionBanner` is a component-map key. No `index` key. Helper and types files register as `ctaBannerBackground` and `callToActionBannerTypes`, harmless non-rendering keys (as `heroBannerTypes` and `galleryUtils` already do). No client-map entry, as expected.
- `npm run type-check`: this script does not exist in `package.json`, so it could not be run. I ran `npx tsc --noEmit --incremental false` instead. The only errors are the missing `.sitecore/sites.json` in `page.tsx`, `robots/route.ts`, `sitemap/route.ts` and `proxy.ts` (pre-existing, see below). One error appeared in `CallToActionBanner.tsx` (optional `LinkField` passed to `Link`). I fixed it, and it now reports no errors in task code.
- `npm run build`: FAILED at `sitecore-tools:build` with `[MV-007] Provide either "contextId" or both "apiHost" and "apiKey"`. This is pre-existing (D-001). Next build did not run, so a production build check was not obtained.

### Pre-existing environment issues

- `npm run build` fails at `sitecore-tools:build` with `[MV-007]` because there is no Sitecore environment configuration. It would fail identically on `main`.
- `tsc` reports the missing `.sitecore/sites.json` (and `metadata.json`) in files this task did not touch. These are generated by the failing build step.
- The task's own code lints clean, passes its tests, and type-checks clean.

### Assumptions

- The SDK `Image` primitive accepts `editable={false}` and `alt=""`. This type-checks. Behaviour in Pages is unverified because the unit tests mock the SDK.
- `useId` is used in the server component for the heading id (the plan allowed `uid` or `useId`).
- `npm run type-check` does not exist, so `tsc` was used as a substitute.
- The `.sitecore/component-map.ts` modification is regenerator output.

### Blockers or follow-ups

- Pages checks that cannot be unit-tested remain for QA and the human: empty-field placeholders for `Link` and `Image` in editing mode, readability on dark bands, and the button stacking and focus ring at real viewports.
- CMS Prerequisites in the plan are handed to the CMS Configuration stage unchanged. Build did not touch Sitecore items.
- `tsconfig.tsbuildinfo` was not committed.

### Governance observations

- `harness/run-state.md` was not edited. The plan names an `npm run type-check` script that the app does not define (its AGENTS.md lists it too), which is a documentation mismatch to flag.

---

## Notes



### Build — orchestrator check (2026-11-24)

- Confirmed: commit `fc43716`, clean working tree, `npm test` with 10 suites and 112 tests passing (re-run by the orchestrator), clean lint, component map entries present, and no `primary` Tailwind utilities.
- **Unverified:** the production build (`[MV-007]`, no Sitecore environment config; known limit D-001), and type-check apart from the pre-existing missing `.sitecore/sites.json` errors. Carried forward to QA.
- Carried forward to QA: the SDK `Image` with `editable={false}` and `alt=""` is mocked in the tests, so its real output is unconfirmed. The component uses `useId` for the heading id in a server component. `package.json` has no `type-check` script, though the plan and AGENTS.md name one (Build used `npx tsc --noEmit`).

### Correctness pass and QA (2026-11-24)

`/code-review high` on `cd6c213..HEAD` found 5 issues. QA decided:

| # | Finding | QA decision |
|---|---|---|
| 1 | Body that contains only markup (`<p></p>`) still renders its wrapper (`CallToActionBanner.tsx:26`) | Confirmed, non-blocking (Medium). If Pages saves `<p></p>` when Body is cleared, it's an AC 4 defect to fix before Complete |
| 2 | A link with an href but no text shows the href as its label (`:28`) | Confirmed, non-blocking (Low). Standard SDK behaviour |
| 3 | `hasScrim` unused (`:23`) | Confirmed, non-blocking (Low). Cleanup |
| 4 | Some tests use DOM structure and compare class strings (`ctaBannerBackground.test.ts:56`) | Partly confirmed, non-blocking (Low) |
| 5 | Empty Heading in editing mode gives the region the accessible name "[No text in field]" (`:38`) | Confirmed, non-blocking (Low). Editors only |

QA verdict: **Pass With Minor Issues**. Candidate follow-up: "CTA Banner polish" (items 1, 3, 4, 5).

**Pre-existing tooling finding (not T007):** `npm run lint` never checks component files. npm's `sh` doesn't expand `**` in the script's glob `./src/**/*.tsx ./src/**/*.ts`, so it matches only `src/*/*.ts(x)` (9 files). "Lint clean", in this run and earlier ones, didn't cover `CallToActionBanner/`. CI uses the same script. `package.json` also lacks the `type-check` script that AGENTS.md and the plan name. Candidate tooling task.

Comparison with the first attempt: QA's earlier non-blocking findings (content left-aligned, no focus ring on body links, no width cap on stacked buttons, `hasRichText` treating media-only bodies as empty) did **not** recur. The design note specified centring, focus treatment, and stacking without being prompted.

### CMS Configuration — orchestrator check (2026-11-24)

Confirmed independently: commit `f6f099e`; `verify-stage.sh cms` passes with the record matching 25 logged writes, all by `cms-config` in this run. Status: **Complete**. Read-only: `Renderings/Feature/harness-engineering` holds only the `CallToActionBanner` Json Rendering (`componentName` `CallToActionBanner`, Datasource Template in Feature, its own Rendering Parameters template). `templates/Feature/harness-engineering` holds exactly the datasource, folder, parameters, and option templates. No stray items; nothing went into the Project layer.

**D-005 findings from the first real run** (for the next harness change):

1. **`create_component` without `modelId` also creates an empty datasource template**, `templates/Feature/harness-engineering/<Name>`, already linked as the rendering's Datasource Template, plus the folder template, datasource folder, parameters template, and Available Renderings entry, all in one call. The agent rightly reused it and added fields with `update_content_type`, instead of creating a second template. D-005's order (create_component, then `create_content_type` for the datasource template, then `update_component`) should become: create_component, then add fields to the template it created. `update_component` with `modelId` stays untested and is no longer needed.
2. `add_component_on_page` returns the rendering ID as `componentId`, not the instance uid. `set_component_datasource` needs the uid from `get_components_on_page`. Worth adding to the agent's shared-datasource rule.
3. The `create_component` default Datasource Location filters by `@@templatename='<Name> Folder'`, which doesn't match the agent's own `@@templateid` preference. It was left unchanged, as the rules say.
4. One unintended no-op `update_content_type` (row 5) was correctly recorded as an Updated row. The record-vs-log check would have failed if it had been left out.

Sample banners are on a new `Home/T007-cms-check` page, not on Home. Layout JSON confirms `BackgroundColour` arrives as a resolved item with `fields.Value.value` = `primary`, as the component expects.
