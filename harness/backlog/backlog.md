# Backlog

This file tracks planned features and future work for the project.

Items in this file are not yet active implementation tasks.

A backlog item should only move into `harness/tasks/` once it has been selected for active work.

---

## Status Values

Suggested status values:

- Planned
- Ready for Spec
- Deferred
- Done

---

## Backlog Items

### B001 — Project Scaffold and Harness Setup
**Status:** Done  
**Summary:** Create the initial repository structure, harness folders, standards, design system, roles, and templates.

---

### B002 — Site Header with Navigation
**Status:** Done  
**Summary:** Implement a site header component that renders authored navigation links from Sitecore layout data. The header should appear in the `headless-header` placeholder, support a site logo, primary navigation items, and responsive mobile behaviour.

---

### B003 — Site Footer
**Status:** Done  
**Summary:** Implement a site footer component rendered in a `headless-footer` placeholder. Should display authored copyright text, secondary navigation links, and social media links from Sitecore fields.

---

### B004 — Hero Banner Component
**Status:** Done  
**Summary:** Create a hero banner rendering component that displays an authored heading, subheading, background image, and optional call-to-action link. Should support full-width layout and be usable in the `headless-main` placeholder.

---

### B005 — Rich Text Content Block
**Status:** Ready for Spec  
**Summary:** Implement a content block component that renders a Sitecore Rich Text field inside a constrained content container. Should handle inline editing in Experience Editor and support standard typographic styling from the design system.

---

### B006 — Promo Card Grid
**Status:** Done  
**Summary:** Create a promo card component and a card grid container component. The grid renders multiple authored promo cards (image, title, description, link) from a nested placeholder or multi-value field. Should be responsive across breakpoints.

---

### B007 — Breadcrumb Navigation
**Status:** Planned  
**Summary:** Implement a breadcrumb component that derives its trail from the current Sitecore route hierarchy. Should render semantic navigation markup and be placed in the `headless-main` placeholder above main content.

---

### B008 — Error and Not Found Pages
**Status:** Planned  
**Summary:** Improve the 404 and error page experiences. The not-found page should attempt to resolve a Sitecore error page item for the current site and locale, displaying authored content rather than a generic fallback. The global error boundary should render a safe fallback.

---

### B009 — Content Listing with Pagination
**Status:** Planned  
**Summary:** Create a content listing component that displays a paginated list of child items or query results. Each item shows a title, summary, date, and link. Pagination should work without full page reloads where feasible.

---

### B010 — Call to Action Banner
**Status:** Planned  
**Summary:** Implement a full-width call-to-action banner component with an authored heading, body text, and one or two action buttons (primary/secondary). Should support configurable background colour or image from Sitecore fields.

---

### B011 — Image Gallery Component
**Status:** Ready for Spec  
**Summary:** Create a responsive image gallery rendering that displays multiple authored images in a grid or carousel layout. Should use the Sitecore Image field and Next.js Image optimisation. Design direction resolved 2026-10-14: carousel with lightbox (no grid).  
**Selected as T006**

---

### B012 — Dictionary-Driven UI Labels
**Status:** Planned  
**Summary:** Replace any hard-coded UI strings (button labels, aria labels, fallback text) with dictionary entries fetched via the Sitecore dictionary service. Ensure the i18n pipeline correctly resolves labels per site and locale.

---

### B013 - Automated CI/CD Testing
**Status:** Done  
**Summary:** Create GitHub Actions to run the tests built into the head application, to ensure that the code still functions when a PR is opened.
