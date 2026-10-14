---
name: ui-design-system
description: The site's visual design system — principles, colour, typography, spacing, layout, components, navigation, responsive and interaction rules. Use when designing a feature, or reviewing an implementation for design alignment.
---

# Design System

## Purpose

This document defines the visual design system used across the application.

The goal of this design system is to create a visual language that is:

- clean
- professional
- readable
- modern
- consistent

The application is **content-driven**, meaning the visual system should support authored content, readable page composition, and reusable component patterns rather than decorative complexity.

This document serves as the **source of truth for visual design decisions** across the project.

All feature designs should follow the rules defined here.

---

# Design Principles

## Content First

Authored content should remain the primary focus of each route.

Typography, spacing, and layout should make content easy to read and scan.

Avoid visual elements that distract from the content.

---

## Structured Composition

The application follows a **route-composed, component-driven approach**.

- layout should support both authored content and application behavior  
- visual hierarchy should be clear even when page sections are composed through placeholders  
- components should remain lightweight, reusable, and predictable  

Avoid feature-specific one-off layout rules that break consistency across authored pages.

---

## Visual Restraint

The application should maintain a minimal, calm aesthetic.

Avoid:

- excessive colour usage  
- heavy shadows or gradients  
- unnecessary visual decoration  
- overly complex layouts  

Design decisions should favour clarity and simplicity.

---

## Consistency

Spacing, typography, layout patterns, and component styles should remain consistent across all pages.

Users should feel that every page belongs to the same visual system.

---

## Accessibility

Design choices must support accessibility:

- maintain strong colour contrast  
- preserve logical heading hierarchy  
- ensure readable font sizes  
- support keyboard interaction where applicable  

Accessibility should be treated as a first-class design concern.

---

# Colour System

The visual identity should use a restrained palette built primarily on neutral tones, with accent colour used sparingly for emphasis.

The palette is intentionally minimal to maintain a calm and professional tone.

---

## Primary Colour

Use the application's primary brand or semantic accent colour sparingly for:

- key accents  
- active navigation states  
- subtle emphasis  

Primary colour should **not dominate the interface**.

---

## Secondary Colour

Use a supporting secondary tone for:

- subtle hover states  
- light emphasis  

Usage should remain minimal.

---

## Accent Colour

Accent colours may be used for:

- small highlights  
- occasional emphasis  

Accent usage should be rare and intentional.

---

## Neutral Palette

Neutrals should provide the structural foundation of the UI.

Neutrals should dominate the interface.

Colour should never be the primary tool for creating hierarchy.

---

## Dark Mode Colour Palette

If the application supports dark mode, it should use the same semantic design-token model as light mode rather than introducing unrelated one-off colors.

---

# Typography

Typography is the **primary visual system driver**.

---

## Primary Font

Primary UI fonts should come from the application's chosen typography stack.

---

## Heading Hierarchy

Suggested heading scale:

- H1 — 36–48px  
- H2 — 30–36px  
- H3 — 24–28px  
- H4 — 20–22px  

Guidelines:

- maintain clear hierarchy  
- avoid skipping heading levels  
- use spacing to reinforce structure  
- avoid decorative styling  

---

## Body Text

Body text should prioritise reading comfort.

Guidelines:

- body font size: 16–18px  
- generous line height  
- limit line length for readability  
- maintain consistent paragraph spacing  

---

## Supporting Text

- use muted colour for metadata (dates, tags, descriptions)  
- ensure supporting text does not compete with primary content  

---

# Spacing System

Spacing should follow a consistent vertical rhythm.

Base spacing scale:

- 4  
- 8  
- 16  
- 24  
- 32  
- 48  
- 64  

---

## Layout Rhythm

Common patterns:

- small grouping: `space-y-4`  
- standard grouping: `space-y-6`  
- section spacing: `space-y-10` to `space-y-16`  

---

## Guidelines

- avoid arbitrary spacing values  
- reuse spacing consistently  
- prioritise vertical rhythm  
- use spacing instead of borders or backgrounds where possible  

---

# Layout System

Pages follow a predictable structural layout:

Page  
→ Section  
→ Container  
→ Content  

---

## Container Width

Guidelines:

- prioritise readable line length  
- keep content centered unless a broader application layout is intentional  
- allow breathing room via padding  
- ensure placeholder-based layouts still feel coherent when authored content varies in length  

---

## Page Structure

Typical structure:

- Header  
- Main Content  
- Footer  

Where the application uses Sitecore-authored placeholders, these regions should remain visually coherent whether they are populated by authored components or fallback content.

Content should be structured into clearly defined sections using spacing.

---

# Section Patterns

Most pages should follow predictable section patterns, but must also tolerate variation introduced by authored component composition.

Sections should be separated primarily by spacing, not heavy visual elements.

---

# Component Strategy

The UI should be built from a **small, focused set of reusable components**.

Guidelines:

- prefer simple, composable components  
- avoid large or complex component systems  
- prioritise reuse over duplication  
- rely on layout and typography rather than visual decoration  

---

## Use of Component Libraries

Component libraries or SDK primitives may be used as implementation building blocks, but:

- they must not define the visual system by themselves  
- unnecessary components should not be imported  
- generated UI should not be copied wholesale  

All components must conform to this design system and to the application's authored-layout model.

---

## Core Component Types

- layout containers  
- header and navigation  
- footer  
- section wrappers  
- typography blocks  
- authored content sections and placeholder-friendly wrappers  
- minimal buttons  
- simple form inputs  

Components should remain lightweight and purpose-driven.

---

# Navigation

Navigation should remain simple and predictable.

Guidelines:

- clear top-level navigation  
- minimal nesting  
- consistent placement  
- calm visual presentation  

Avoid complex navigation patterns that conflict with Sitecore-authored information architecture.

---

# Responsive Design

The application must work cleanly across:

- mobile  
- tablet  
- desktop  

Guidelines:

- use mobile-first layout thinking  
- maintain readable text sizes  
- preserve hierarchy across breakpoints  
- ensure container width does not become excessive on large screens  

---

# Interaction Design

Interactive elements should behave consistently and subtly.

Examples include:

- button hover states  
- link hover behaviour  
- focus states  
- navigation highlights  

Guidelines:

- interactions should be minimal and unobtrusive  
- avoid unnecessary animation  
- use simple visual feedback (underline, slight colour shift)  

---

# Accessibility Expectations

Design decisions should support accessibility by default.

Requirements include:

- sufficient colour contrast  
- readable font sizes  
- logical heading order  
- clear focus states  
- meaningful link text  

Accessibility is a core requirement, not optional.

---

# When the Design System Should Change

The design system should evolve when:

- repeated layout or readability issues appear  
- new content patterns emerge  
- accessibility improvements are required  
- better component patterns are identified  

Changes must be documented clearly in this file.

---

# Changing the Design System

Changing this file is a harness change, made only when the human asks for one — never as a side effect of feature work. If a feature needs a pattern the system doesn't define, the Feature Design agent records it as an open question rather than inventing it.

When a change is requested:

1. Identify where visual patterns are unclear, inconsistent, or missing, using feedback from implemented features and design issues found in QA.
2. Define the reusable pattern, not a one-off for a single feature.
3. Keep it consistent with the design principles above. Favour simplicity; the system should stay lightweight.
4. Escalate instead of changing the file when a feature needs a completely new design direction, design principles conflict, or an accessibility concern needs significant change.

---

# Relationship to Feature Design

The **Feature Design agent** applies this system when designing features. The **QA agent** checks implementations against it.

Feature designs must:

- reuse existing patterns  
- follow spacing and typography rules  
- avoid introducing new visual systems  

The goal is a cohesive, unified UI across the entire application.
