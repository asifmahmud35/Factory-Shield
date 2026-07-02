---
title: 'FactoryShield — Product Requirements Document'
status: 'final'
created: '2026-07-02'
updated: '2026-07-02'
---

# FactoryShield — Product Requirements Document (PRD)

**Author:** Asif
**Stakes:** Launch/production (single-factory pilot, already partially live)
**Sources:** `docs/PRD.md` · `docs/Epic-2-Investigate-Resolve-Final.md` · `docs/FactoryShield_Epic2_Approver_Workflow.md` · `docs/FactoryShield_Reporter_Epic_1_Reporting_an_Incident_2.md` · `docs/FactoryShield_Monitoring_Governance_Spec.md` · `docs/stories/FS-*.md` — this document distills those into BMAD's canonical PRD shape (globally-numbered FRs, capabilities not implementation). Implementation-level detail extracted during distillation lives in `addendum.md`.

---

## 1. Product Overview

FactoryShield is an incident management system for manufacturing factories. It lets factory workers report safety and operational incidents from the floor, routes those incidents through a structured review-and-resolution pipeline, enforces SLA timelines with automatic escalation, and produces an immutable compliance audit trail. It serves eight roles across a single factory site, on web (desktop + mobile).

## 2. Problem Statement

Factory incidents — safety hazards, equipment failures, quality defects, near-misses — are currently reported through paper forms, WhatsApp groups, or verbal handoffs, which causes: lost or delayed reports, no audit trail for regulators, unnoticed SLA breaches, duplicate incidents flooding reviewers, investigations tracked in disconnected spreadsheets, and no real-time visibility for senior managers into open critical incidents. FactoryShield solves all of these in one structured, role-aware platform.

## 3. Personas

- **Reporter** — factory worker, supervisor, quality inspector, maintenance worker, contractor, or visitor. Needs: a sub-60-second report flow, photo upload, clear confirmation, status visibility, anonymous option.
- **Approver (L1 Supervisor)** — runs the first-level review queue. Needs: urgency-sorted queue, claim-lock to prevent double-work, staged SLA warnings, clear decision actions, full audit trail.
- **Resolver** — technician/safety officer/engineer who fixes the incident. Needs: clear task list, investigation workspace, CAPA tracking, ability to mark resolved.
- **Manager / Plant Manager / Safety Officer** — senior role, read access to all incidents, executive dashboard, second-approver in dual-control gates. Needs: KPI scorecard, cross-department view, SLA breach alerts, compliance reports.
- **Compliance Officer / Admin** — auditor-level. Needs: immutable audit log, identity-unmask with access logging, user management.

## 4. Product Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| No incident gets lost | Incidents with SLA start | 100% |
| Faster approver response | Avg time to first decision | < 2 hours |
| SLA breach reduction | % incidents resolved within SLA | ≥ 85% |
| Audit completeness | % incidents with full state log | 100% |
| Reporter adoption | % incidents submitted digitally vs paper | > 70% at 3 months |
| Duplicate reduction | Merge rate vs total submissions | < 10% |

**Counter-metric:** Reporter adoption must not be chased by lowering report-form friction to the point that report *quality* (category/severity accuracy) drops — track mis-triage rate (Approver reclassification %) alongside adoption.

## 5. Functional Requirements

Grouped by the workflow stage each capability belongs to. Status reflects current build state (`Done` / `Ready` / `Planned`), tracked independently from BMAD sprint tracking.

### 5.1 Reporting (Reporter)

| ID | Capability | Status |
|---|---|---|
| FR-1 | Submit a quick incident report (category, severity, description, location) | Done |
| FR-2 | Attach photo, voice note, or supporting evidence to a report | Done |
| FR-3 | View confirmation and simple status after submitting | Done |
| FR-4 | Report offline and sync later when connectivity returns | Ready |
| FR-5 | Report anonymously or confidentially, with identity masked from non-authorized roles | Ready |
| FR-6 | Report with location or QR-assisted context | Planned |
| FR-7 | Report on behalf of another worker | Planned |
| FR-8 | Provide additional information when an Approver requests it (resumes a paused SLA clock) | Done |

### 5.2 Review & Triage (Approver)

| ID | Capability | Status |
|---|---|---|
| FR-9 | View and filter the incoming review queue, sorted by urgency | Done |
| FR-10 | Claim an incident before acting on it, preventing double-work by another Approver | Done |
| FR-11 | Review full incident detail and attached evidence | Done |
| FR-12 | Approve an incident and hand it off to a Resolver with a note | Done |
| FR-13 | Reject an incident, Soft (reporter can revise) or Hard (terminal) | Done |
| FR-14 | Reassign an incident's category or severity, with loop protection against repeated reassignment | Done |
| FR-15 | Escalate an incident manually, or have it auto-escalate on SLA breach | Done |
| FR-16 | Merge duplicate incident reports into one | Done |
| FR-17 | Request more information from the Reporter, pausing the SLA clock until they respond | Done |
| FR-18 | Receive staged SLA warnings (before breach) without notification fatigue | Done |
| FR-19 | View a full audit trail of every Approver decision on an incident | Done |

### 5.3 Investigation & Resolution (Resolver)

| ID | Capability | Status |
|---|---|---|
| FR-20 | View only incidents assigned to me, sorted by SLA urgency | Done |
| FR-21 | Open an assigned incident and see full detail plus the Approver's handoff note | Done |
| FR-22 | Complete a structured investigation checklist with live completion tracking | Done |
| FR-23 | Add timestamped, append-only timeline events (including evidence uploads) during investigation | Done |
| FR-24 | Record root cause analysis (methodology, findings, lessons learned) | Done |
| FR-25 | Create and track one or more Corrective Actions (CAPA) with owner, deadline, completion % | Done |
| FR-26 | Mark an incident Resolved once CAPA prerequisites are met | Done |
| FR-27 | Escalate an incident I cannot resolve alone, without losing it from my queue | Done |

### 5.4 Governance & Executive Oversight (Manager / Safety / Compliance)

Applies to high-severity (L3/L4) incidents only — low/medium severity skips straight from Resolver to Resolved.

| ID | Capability | Status |
|---|---|---|
| FR-28 | Submit an approval vote at a governance gate (`CLOSE_INVESTIGATION`, `ROOT_CAUSE_SIGN_OFF`, `CAPA_VERIFICATION`, `RESOLUTION_FINAL`) | Done |
| FR-29 | Require two independent, distinct actors to approve each gate before the pipeline advances (dual-control) | Done |
| FR-30 | Enforce Separation of Duties — the same actor cannot approve two consecutive gates on one incident | Done |
| FR-31 | View a "Pending Approvals" queue of incidents currently blocked on my vote | Done |
| FR-32 | View an Executive Dashboard KPI scorecard (open incidents by severity/status/department, avg resolution time, SLA breach count, CAPA completion rate) filterable by date range | Done |
| FR-33 | View the complete, role-scoped, append-only timeline of every action taken on an incident | Done |

### 5.5 Compliance & Analytics

| ID | Capability | Status |
|---|---|---|
| FR-34 | Maintain a full, append-only audit log of every state-changing action | Done |
| FR-35 | Unmask a Reporter's identity for authorized, logged reasons (confidentiality bypass) | Done |
| FR-36 | Deliver real notifications (push / email / digest), not just in-app | Ready |
| FR-37 | View a cross-reporter compliance/pattern dashboard | Done |
| FR-38 | View analytics charts: incidents over time, CAPA trend, SLA trend, department breakdown | Done |
| FR-39 | Manage users — create, deactivate, reassign roles (Admin) | Planned |
| FR-40 | Automatic escalation on SLA breach, with a second-level escalation if unacknowledged | Done |

## 6. Non-Functional Requirements

- **Performance:** Approver queue responds < 300ms up to 500 open incidents; Executive Dashboard < 2s; Angular initial load < 3s on 10Mbps; SLA background check completes within its 5-minute cycle.
- **Security:** All endpoints require authentication except login/health. Role-based policy enforcement at both API and command-handler level. Approval and audit-log records are immutable at the database level — no update, no delete, no admin override. Uploads are hash-verified, size- and type-restricted.
- **Availability:** Single-factory, on-premise pilot — no formal SLA guarantee required yet. Background jobs must be durable across process restarts.
- **Accessibility:** WCAG 2.1 AA target for the Reporter form and Approver queue; colour is never the sole status indicator; all critical actions keyboard-accessible.
- **Localisation:** English at launch; Bangla-first reporting planned post-launch.

## 7. RBAC — Roles & Permissions

| Role | Active |
|---|---|
| Reporter | Launch |
| Approver | Launch |
| Resolver | Launch |
| Manager / Plant Manager / Safety Officer | Launch |
| Compliance Officer | Launch |
| Admin | Launch |
| Guest | Post-launch |

Key rule: submitting an incident is open to Reporter/Approver/Resolver (on-behalf); everything downstream is role-gated per the workflow stage it belongs to (see FR tables above). Identity-unmask and full audit-timeline access are restricted to Compliance Officer (and logged when used).

## 8. Constraints and Boundaries

- Single factory, single PostgreSQL database — no multi-tenant schema.
- On-premise; no cloud dependency; local file storage behind an abstraction.
- No SMS/email delivery yet — notifications are in-app only until FR-36 ships.
- Severity is stored as an integer with presentation-layer labels, never as a stored string.
- Exactly one component may transition an incident's status — no other code path may write it directly.
- Department is a free-text field, not a foreign key, in this phase — a deviation from the eventual departments-table design, documented rather than silently diverged.

## 9. Out of Scope (this phase)

Offline sync (PWA), QR code entry, cross-reporter compliance dashboard, real push/email notifications, multi-factory/multi-tenant, native mobile app, AI root-cause suggestion (UI stub only, no backend), Bangla-first UI, anonymous/confidential reporting, user-management UI, SLA-threshold configuration UI, workflow-routing-rules UI.

---

## Resolved Assumptions (from Finalize)

- **Stakes:** confirmed launch/production — `docs/SPRINT_PLANNING.md` shows Sprints 0–11 re-verified against running code as of 2026-07-02.
- **FR-19 / FR-37 status:** confirmed **Done**, not "Ready" — `docs/PROJECT_STATUS.md` lists both the Compliance Dashboard and Approval Audit Trail panel as implemented on the frontend, backed by fully-shipped backend endpoints (FS-27, FS-29).

---
*Distilled from `docs/PRD.md` and related epic/governance source documents on 2026-07-02, then finalized with a light review pass (assumptions resolved against `docs/PROJECT_STATUS.md`) rather than the full multi-subagent Reviewer Gate, per user direction given this is a backfill of already-shipped, in-production functionality. See `addendum.md` for implementation-level detail (data model fields, state machine names, specific endpoint routes) extracted out of this document.*
