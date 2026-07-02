# Story FS-03b: Basic Frontend Styling Pass

**Status:** Done
**Epic source:** N/A (cross-cutting visual polish, not from PRD)
**Depends on:** FS-03 (Done)
**Blocks:** none — resume FS-04 immediately after this

---

## Story

As a developer, I want the existing Reporter-facing pages (Login, Dashboard, Report Form, My Incidents) to share a consistent, presentable visual style, so the submission demo doesn't look like unstyled placeholder HTML.

## Acceptance Criteria

1. Given any page in the app, then a shared layout shell (header with "FactoryShield" title, current user's role badge, logout button) wraps the page content consistently.
2. Given the Login page, then it has a centered card layout with styled inputs and a clear submit button — not the default unstyled browser form look.
3. Given the Report Form page, then form fields (dropdowns, textarea) and the submit button are visually consistent and readable, with validation errors styled distinctly (e.g. red text/border, not just plain text).
4. Given the My Incidents list, then the table has clear visual hierarchy (header row visually distinct from data rows), and `StatusBadgeComponent` colors remain readable against the background.
5. Given the app overall, then a single consistent color palette and spacing scale is used, defined once as CSS custom properties in a global stylesheet — not ad-hoc colors picked per component.
6. Given the styling pass is complete, then no existing functionality breaks — quickly re-verify login, incident submission, and the my-incidents list still work after the CSS changes (regression check, not a full AC re-test).

## Tasks / Subtasks

- [x] Define a small design system in the global stylesheet: CSS custom properties for primary/secondary/success/warning/error colors, a spacing scale, and a font stack
- [x] Build a shared layout/shell component — header showing app name, current user's role (from `AuthService`), logout button; wraps the router outlet content on all authenticated pages
- [x] Style `LoginComponent` — centered card, styled inputs and submit button
- [x] Style `ReportFormComponent` — consistent field styling, clearly styled validation error states
- [x] Style `MyIncidentsListComponent` — table styling with clear header/row distinction, confirm `StatusBadgeComponent` contrast is readable against the new palette
- [x] Style `DashboardComponent` minimally (it's currently just a health-check placeholder)
- [x] Regression check: confirm login, incident submission, and the my-incidents list all still function correctly after the CSS changes
- [x] Manually verify all 6 Acceptance Criteria

## Dev Notes

Keep this fast — plain CSS with custom properties, no UI component library (Angular Material or similar) to avoid setup and dependency overhead given the time budget. This is explicitly a **visual-only pass**: no new routes, no new API calls, no behavior changes to anything built in FS-00 through FS-03.

Design the color palette and spacing scale generically now — Approver and Resolver views (FS-04 onward) should be able to reuse this same system without redoing it, since `StatusBadgeComponent` and the shared layout shell are already built to be role-agnostic.

## Definition of Done

- [x] All acceptance criteria above pass manually
- [x] Status updated to `Done` at the top of this file
- [ ] (git commit deferred — batching at end of Day 1 per project plan)
