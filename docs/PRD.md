# FactoryShield — Product Requirements Document (PRD)

**Author:** Asif
**Date:** 2026-07-01
**Status:** Active — reflects Sprint 0–6 complete, Sprint 7 Ready
**Sources:** Epic 1 PRD · Epic 2 PRD · Governance Spec · Figma (Investigation Workspace) · FULL_ARCHITECTURE.md

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Personas](#3-personas)
4. [Product Goals & Success Metrics](#4-product-goals--success-metrics)
5. [Epic Summary](#5-epic-summary)
6. [Epic 1 — Reporter: Reporting an Incident](#6-epic-1--reporter-reporting-an-incident)
7. [Epic 2 — Approver: Reviewing and Approving an Incident](#7-epic-2--approver-reviewing-and-approving-an-incident)
8. [Epic 3 — Resolver: Investigating and Resolving an Incident](#8-epic-3--resolver-investigating-and-resolving-an-incident)
9. [Epic 4 — Governance: Dual-Control Approval and Executive Oversight](#9-epic-4--governance-dual-control-approval-and-executive-oversight)
10. [Epic 5 — Compliance and Analytics](#10-epic-5--compliance-and-analytics)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [RBAC — Roles and Permissions](#12-rbac--roles-and-permissions)
13. [Constraints and Boundaries](#13-constraints-and-boundaries)
14. [Out of Scope (MVP)](#14-out-of-scope-mvp)

---

## 1. Product Overview

**FactoryShield** is an incident management system for manufacturing factories. It enables factory workers to report safety and operational incidents from the floor, routes those incidents through a structured review and resolution pipeline, enforces SLA timelines with automatic escalation, and produces an immutable compliance audit trail.

The system serves five distinct roles across a single factory site. It operates on a web browser (desktop + mobile) and is designed for eventual offline-first and QR-assisted entry from the factory floor.

---

## 2. Problem Statement

Factory incidents — safety hazards, equipment failures, quality defects, near-misses — are currently reported through paper forms, WhatsApp groups, or verbal handoffs. This means:

- Reports are lost, delayed, or never reach the right person.
- No audit trail exists when regulators ask "what happened and who acted?"
- SLA breaches go unnoticed until after the fact.
- Duplicate incidents flood the same reviewer without visibility into overlap.
- Investigations and corrective actions are tracked in disconnected spreadsheets.
- Senior managers have no real-time visibility into open critical incidents.

FactoryShield solves all of these in one structured, role-aware platform.

---

## 3. Personas

### Reporter
Factory worker, line supervisor, quality inspector, maintenance worker, contractor, or visitor. Reports an issue from the floor — ideally in under 60 seconds from any device. May have low digital literacy.

**Needs:** Simple form, photo upload, clear confirmation, status visibility, ability to report anonymously.

### Approver (L1 Supervisor)
Factory supervisor responsible for the first-level review queue. Reviews, validates, classifies, assigns to a Resolver, and manages SLA.

**Needs:** Urgency-sorted queue, claim lock to prevent double-work, staged SLA warnings, clear decision actions, full audit trail.

### Resolver
Technician, safety officer, or engineer assigned to fix the incident. Works the resolution pipeline: investigation, CAPA actions, verification.

**Needs:** Clear task list, investigation workspace, CAPA tracking, ability to mark resolved.

### Manager / Plant Manager / Safety Officer
Senior role with read access to all incidents, executive dashboard, and ability to act as second approver in dual-control gates.

**Needs:** KPI scorecard, cross-department view, SLA breach alerts, compliance reports.

### Compliance Officer / Admin
Auditor-level role. Views full audit trails including confidential identity access logs. Manages user accounts and workflow configuration.

**Needs:** Immutable audit log, identity unmask with access logging, user management.

---

## 4. Product Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Incident never gets lost | Incidents with SLA start | 100% |
| Faster approver response | Avg time to first decision | < 2 hours |
| SLA breach reduction | % incidents resolved within SLA | ≥ 85% |
| Audit completeness | % incidents with full state log | 100% |
| Reporter adoption | % incidents submitted digitally vs paper | > 70% at 3 months |
| Duplicate reduction | Merge rate vs total submissions | < 10% (low overlap = accurate reporting) |

---

## 5. Epic Summary

| Epic | Role | Sprint | Status |
|------|------|--------|--------|
| Epic 1 — Reporting an Incident | Reporter | Sprint 1 | ✅ Complete |
| Epic 2 — Reviewing and Approving an Incident | Approver | Sprint 2–6 | ✅ Complete |
| Epic 3 — Investigating and Resolving an Incident | Resolver | Sprint 3–4 | ✅ Complete |
| Epic 4 — Dual-Control Approval and Executive Oversight | Manager / Governance | Sprint 7 | 🔲 Ready |
| Epic 5 — Compliance, Analytics, and Notifications | Compliance Officer / Admin | Sprint 8–10 | 🔲 Planned |

---

## 6. Epic 1 — Reporter: Reporting an Incident

> Full specification: [FactoryShield_Reporter_Epic_1_Reporting_an_Incident_2.md](FactoryShield_Reporter_Epic_1_Reporting_an_Incident_2.md)

### Goal
A Reporter can capture any factory floor issue quickly from any device and know it has been received.

### User Stories (Summary)

| # | Title | Status |
|---|-------|--------|
| US-1 | Access reporting by Login, Guest Mode, or QR | ✅ Done (MVP: Login only) |
| US-2 | Submit a quick incident report | ✅ Done |
| US-3 | Add photo, voice note, or supporting evidence | ✅ Done |
| US-4 | Report offline and sync later | Deferred to Sprint 9 |
| US-5 | Report anonymously or confidentially | Sprint 8 (FS-24) |
| US-6 | Report with location or QR context | Deferred to Sprint 9 |
| US-7 | View confirmation and simple status | ✅ Done |
| US-8 | Report on behalf of another worker | Deferred |

### Key Outputs (for downstream epics)
- `incident_id`, `incident_reference`, severity (SMALLINT 1–4), category, status
- `created_by_user_id`, `created_at`, `local_event_time`
- Attachments list with `upload_status`
- `display_status` projection for Reporter view

---

## 7. Epic 2 — Approver: Reviewing and Approving an Incident

> Full specification: [FactoryShield_Epic2_Approver_Workflow.md](FactoryShield_Epic2_Approver_Workflow.md)

### Goal
An Approver processes every incoming incident before it reaches a Resolver — validating it, classifying it, and assigning it — without double-work or SLA blindness.

### User Stories (Summary)

| # | Title | Status |
|---|-------|--------|
| US-1 | View and filter the review queue | ✅ Done |
| US-2 | Claim an incident before acting on it | ✅ Done (Sprint 6) |
| US-3 | Review incident details and evidence | ✅ Done |
| US-4 | Approve an incident and hand it off clearly | ✅ Done |
| US-5 | Reject an incident — Soft or Hard | ✅ Done |
| US-6 | Reassign category or severity with loop protection | ✅ Done (Sprint 6) |
| US-7 | Escalate an incident — manual or SLA-based | ✅ Done (Sprint 5) |
| US-8 | Merge duplicate incidents | ✅ Done (Sprint 6) |
| US-9 | Request more information from Reporter (SLA pause) | ✅ Done (Sprint 6) |
| US-10 | Notifications without fatigue — staged SLA warnings | ✅ Done (Sprint 5) |
| US-11 | Audit trail of Approver decisions | Partial (Sprint 8 — full log) |

### Key State Transitions
`SUBMITTED → TRIAGED` (approve) · `SUBMITTED → REJECTED` · `SUBMITTED → PENDING_REPORTER_INPUT` · `SUBMITTED → MERGED_CLOSED`

---

## 8. Epic 3 — Resolver: Investigating and Resolving an Incident

### Goal
A Resolver receives a clearly-handed-off incident, conducts an investigation with structured checklist and timeline, defines corrective actions, and marks the incident resolved.

### Persona: Resolver

Factory technician, engineer, or specialist assigned by an Approver. Responsible for fixing the root cause — not just closing the ticket.

**Needs:** Clear assigned queue, investigation workspace, CAPA task tracking, ability to escalate back if blocked, status visibility to the Reporter.

### Epic User Journey

1. Resolver opens FactoryShield and sees their **Assigned Incidents** list — only incidents assigned to them by an Approver.
2. Resolver opens an incident: full submitted details, Approver's handoff note, SLA countdown.
3. Resolver works through the investigation: fills checklist, adds timeline events, uploads evidence, assigns root cause.
4. If the incident severity is L1/L2 (Low/Medium): skip investigation pipeline, go directly to mark resolved.
5. If severity is L3/L4 (High/Critical): complete investigation checklist → submit CLOSE_INVESTIGATION approval (dual-control, Sprint 7) → proceed to CAPA.
6. Resolver creates one or more **Corrective Actions** with owners, deadlines, and completion percentage.
7. Once all CAPA tasks are verified, Resolver marks the incident **Resolved**.
8. Reporter's status view updates to "Resolved".
9. For severity L3/L4: a second approval actor (Manager) must confirm CAPA and close the case.

---

### User Stories

#### US-1: View Assigned Incidents

> As a Resolver, I want to see only incidents assigned to me, sorted by SLA urgency, so that I focus on the right thing first.

**Acceptance Criteria**

- **Given** I am logged in as a Resolver, **then** I see only incidents where `assigned_resolver_id = me`, in status `ASSIGNED` or `IN_PROGRESS`.
- **Given** incidents are assigned to me, **then** they are sorted by SLA stage (Critical first), then severity, then age.
- **Given** an incident's SLA is at 80%+, **then** it shows a red `!` badge.
- **Given** an incident is resolved or closed, **then** it disappears from my assigned list.

**Fields:** `assigned_resolver_id`, `status`, `sla_stage`, `sla_remaining`, `severity`, `handoff_note`

---

#### US-2: Open and Review Incident Detail

> As a Resolver, I want to see full incident details and the Approver's handoff note so that I understand what I'm being asked to fix.

**Acceptance Criteria**

- **Given** I open an assigned incident, **then** I see: category, severity, location, description, attachments, timeline events, and the Approver's handoff note.
- **Given** the incident is confidential, **then** I see the content but not the Reporter's identity (unless I hold an authorized role).
- **Given** I am the assigned Resolver, **then** the status automatically transitions from `ASSIGNED → IN_PROGRESS` on first open.

**Fields:** `incident_id`, `handoff_note`, `description`, `category`, `severity`, `timeline_events`, `attachment_list`, `reporter_visibility`

---

#### US-3: Complete the Investigation Checklist

> As a Resolver, I want to work through a structured investigation checklist so that the inquiry is systematic and trackable.

**Acceptance Criteria**

- **Given** I open the Investigation Workspace, **then** I see the 8-item investigation checklist with completion percentage.
- **Given** I check an item, **then** the overall completion percentage updates in real time.
- **Given** completion is below 100%, **then** the CLOSE_INVESTIGATION button remains disabled.
- **Given** all items are checked, **then** I can submit the investigation for approval.
- **Given** I save partial progress, **then** my checked items persist on next open.

**Fields:** `investigation_id`, `checklist_items[]` (8 items), `checklist_completion_pct`, `investigation_status`

---

#### US-4: Add Investigation Timeline Events

> As a Resolver, I want to add timestamped events to the investigation timeline so that a reader can reconstruct exactly what happened and when.

**Acceptance Criteria**

- **Given** I add a timeline event with description, **then** it is timestamped, attributed to me, and added to the investigation's ordered timeline.
- **Given** I upload evidence during the investigation, **then** it appears as a timeline event with file preview.
- **Given** I view the timeline, **then** events are in chronological order and I can distinguish submission events from investigation events.
- **Given** a timeline event is saved, **then** I cannot edit or delete it — it is append-only.

**Fields:** `investigation_timeline_event_id`, `event_type`, `description`, `created_by`, `created_at`, `attachment_id` (nullable)

---

#### US-5: Define Root Cause and Methodology

> As a Resolver, I want to record root cause analysis so that the organisation understands why the incident happened.

**Acceptance Criteria**

- **Given** I complete the investigation checklist, **then** I can fill in: `root_cause_code`, `methodology_used` (5-Why, Fishbone, Fault Tree), `findings_summary`, `lessons_learned`.
- **Given** I save root cause fields, **then** they are linked to the investigation record.
- **Given** root cause is not filled, **then** I cannot advance to CAPA.

**Fields:** `root_cause_code`, `methodology_used`, `methodology_rationale`, `findings_summary`, `immediate_action_taken`, `lessons_learned`

---

#### US-6: Create and Track Corrective Actions (CAPA)

> As a Resolver, I want to define corrective actions with owners and deadlines so that the root cause is systematically fixed.

**Acceptance Criteria**

- **Given** the investigation phase is complete, **then** I can add one or more CAPA tasks: description, owner, target date, priority.
- **Given** I create a CAPA task, **then** I can update its completion percentage (0–100).
- **Given** a CAPA task reaches 100% completion, **then** I can mark it "Verified".
- **Given** no CAPA tasks exist, **then** the "Mark Resolved" button is disabled.
- **Given** at least one CAPA task is verified, **then** I can mark the incident Resolved.

**Fields:** `corrective_action_id`, `incident_id`, `description`, `owner`, `target_date`, `priority`, `completion_pct`, `verified_at`, `verified_by`

---

#### US-7: Mark Incident Resolved

> As a Resolver, I want to mark an incident resolved when the corrective action is complete so that the pipeline closes cleanly.

**Acceptance Criteria**

- **Given** at least one CAPA task is created, **then** the "Mark Resolved" button is enabled.
- **Given** I click Mark Resolved, **then** `status → RESOLVED`, the incident leaves my assigned list, and the Reporter's status view updates.
- **Given** the incident's severity is L3/L4, **then** status transitions to `VERIFICATION` instead of `RESOLVED` — a dual-control approval gate opens (Epic 4).
- **Given** I mark resolved, **then** the SLA clock stops.

**Fields:** `resolved_by`, `resolved_at`, `resolution_note`, `status: RESOLVED` or `VERIFICATION`

---

#### US-8: Request Assistance or Escalate

> As a Resolver, I want to escalate an incident I cannot resolve alone so that it reaches a more senior expert.

**Acceptance Criteria**

- **Given** I cannot complete resolution, **then** I can escalate with a note — this notifies the Approver who assigned me and sets a flag for manager review.
- **Given** I escalate, **then** the incident does not leave my assigned queue but is flagged `Escalation Requested`.
- **Given** the Approver receives my escalation, **then** they can reassign to another Resolver or escalate upward.

**Fields:** `escalation_requested_by`, `escalation_requested_at`, `escalation_note`, `escalation_type: RESOLVER_BLOCKED`

---

### Epic 3 Field Summary

| Group | Fields |
|-------|--------|
| **Assigned queue** | `assigned_resolver_id`, `status`, `sla_stage`, `handoff_note` |
| **Investigation** | `checklist_items[]`, `checklist_completion_pct`, `investigation_status`, `owner`, `investigation_date`, `target_completion` |
| **Timeline** | `event_type`, `description`, `created_by`, `created_at`, `attachment_id` |
| **Root Cause** | `root_cause_code`, `methodology_used`, `findings_summary`, `lessons_learned`, `immediate_action_taken` |
| **CAPA** | `corrective_action_id`, `description`, `owner`, `target_date`, `completion_pct`, `verified_at` |
| **Resolution** | `resolved_by`, `resolved_at`, `resolution_note`, status transition |
| **Escalation** | `escalation_type`, `escalation_requested_by`, `escalation_note` |

---

## 9. Epic 4 — Governance: Dual-Control Approval and Executive Oversight

### Goal
High-severity incidents must pass through dual-control approval gates — no single person can unilaterally close an investigation, sign off root cause, verify CAPA, or close a case. Executives get a KPI dashboard without needing to open individual incidents.

### Background

The Governance Spec defines four approval gate types in the pipeline:

| Gate | Fires at stage | Both approvers must be |
|------|----------------|------------------------|
| `CLOSE_INVESTIGATION` | Investigation checklist 100% complete | Resolver + Manager |
| `ROOT_CAUSE_SIGN_OFF` | RCA submitted | Manager + Safety/Compliance Officer |
| `CAPA_VERIFICATION` | All CAPA tasks verified | Resolver + Manager |
| `RESOLUTION_FINAL` | RESOLVED → CLOSED | Manager + Plant Manager |

**Separation of Duties (SoD):** The same actor cannot approve two consecutive gates on the same incident.

### User Stories

#### US-1: Submit an Approval Vote

> As an authorized approver, I want to submit my approval or rejection for the current gate so that the pipeline advances only when two independent actors agree.

**Acceptance Criteria**

- **Given** an incident is at a gated stage, **then** I see the current gate type and who else has approved (if anyone).
- **Given** I click "Approve", **then** my vote is recorded with my actor ID, role, timestamp, and `approval_type`.
- **Given** I am the only actor who has approved so far, **then** the pipeline does not advance yet — it waits for a second distinct actor.
- **Given** a second distinct actor approves the same gate, **then** the pipeline advances to the next stage.
- **Given** I try to approve a gate that I already approved, **then** the system returns a 403 with message "Already approved this gate."
- **Given** I reject a gate, **then** the incident returns to the previous stage (e.g., CAPA_VERIFICATION rejection → back to CAPA_EXECUTION).

**Fields:** `approval_event_id`, `incident_id`, `approval_type`, `actor_id`, `actor_role`, `decision` (APPROVE/REJECT), `submitted_at`, `rejection_reason`

---

#### US-2: Separation of Duties (SoD) Enforcement

> As a compliance system, I want to block the same actor from approving two consecutive stages on the same incident so that no single person can unilaterally progress a high-severity case.

**Acceptance Criteria**

- **Given** actor X approved `ROOT_CAUSE_SIGN_OFF`, **then** actor X cannot be the second approver for `CAPA_VERIFICATION` on the same incident.
- **Given** actor X attempts this, **then** the API returns 403 with message "Separation of Duties violation."
- **Given** actor X approved `ROOT_CAUSE_SIGN_OFF` and actor Y approved `CAPA_VERIFICATION`, **then** actor X can now be one of the approvers for `RESOLUTION_FINAL` (SoD window resets after 2 consecutive gate separation).

**Fields:** `previous_approval_actor_id` (checked at gate submission), SoD log entry

---

#### US-3: View Pending Approvals Panel

> As a Manager or Safety Officer, I want to see which incidents currently need my approval so that I don't miss a gate that's blocking resolution.

**Acceptance Criteria**

- **Given** I am a Manager/Plant Manager/Compliance Officer, **then** I see a "Pending Approvals" count badge in my navigation.
- **Given** I open the Approvals view, **then** I see incidents in gated stages sorted by severity then age, with: gate type, who else has approved, and SLA remaining.
- **Given** I click an incident, **then** I go to its Approval Panel.

**Fields:** `pending_approvals_count`, gate type, `approval_event[]` (who already voted), `sla_remaining`

---

#### US-4: Executive Dashboard — KPI Scorecard

> As a Plant Manager or Safety Officer, I want a single-page KPI view so that I understand the factory's incident health without opening individual tickets.

**Acceptance Criteria**

- **Given** I open the Executive Dashboard, **then** I see:
  - Total open incidents (count)
  - Breakdown by severity: Critical / High / Medium / Low
  - Breakdown by status: Submitted / In Progress / Investigation / Resolved / Closed
  - Breakdown by department (top 5 by incident count)
  - Average time to resolve (rolling 30 days)
  - SLA breach count (current month)
  - CAPA completion rate (% of all CAPA actions at 100%)
- **Given** I filter by date range, **then** all metrics recalculate.
- **Given** the dashboard is first opened, **then** it loads within 2 seconds.

**Fields:** `total_open`, `by_severity[]`, `by_status[]`, `by_department[]`, `avg_resolution_minutes`, `sla_breach_count`, `capa_completion_rate`

---

#### US-5: Incident Timeline View

> As a Manager or Compliance Officer, I want to view the complete ordered timeline of every action taken on an incident so that I can reconstruct the full lifecycle.

**Acceptance Criteria**

- **Given** I open an incident's timeline, **then** I see every event in chronological order: submission, evidence upload, claim, decision, escalation, reassignment, approval votes, status changes.
- **Given** I am a Reporter, **then** I see only PUBLIC-scoped events (not internal decisions or audit rows).
- **Given** I am a Compliance Officer, **then** I see ALL events including RESTRICTED scope (identity access, SoD decisions).
- **Given** an event is in the log, **then** it cannot be edited or deleted by any role.

**Fields:** `incident_state_log_id`, `event_type`, `actor_id`, `actor_role`, `description`, `previous_value`, `new_value`, `visibility_scope` (PUBLIC / INTERNAL / RESTRICTED), `created_at`

---

### Epic 4 Field Summary

| Group | Fields |
|-------|--------|
| **Approval events** | `approval_event_id`, `approval_type`, `actor_id`, `actor_role`, `decision`, `submitted_at`, `rejection_reason` |
| **SoD enforcement** | `previous_approval_actor_id`, SoD violation log |
| **Executive KPIs** | `by_severity[]`, `by_status[]`, `by_department[]`, `avg_resolution_minutes`, `sla_breach_count`, `capa_completion_rate` |
| **Timeline** | `incident_state_log_id`, `event_type`, `visibility_scope`, `previous_value`, `new_value` |
| **Immutability** | DB-level `REVOKE UPDATE, DELETE ON approval_events` and `incident_state_log` for app role |

---

## 10. Epic 5 — Compliance and Analytics

### Goal
Compliance Officers and Admins have the tools to audit every action in the system. Reporting and analytics surface trends across incidents, CAPA, and SLA performance.

### User Stories (Planned — Sprint 8–10)

| # | Title | Sprint |
|---|-------|--------|
| US-1 | Full `incident_state_log` — every action writes an append-only row | Sprint 8 (FS-23) |
| US-2 | Anonymous / confidential reporting with identity masking | Sprint 8 (FS-24) |
| US-3 | Real notification delivery — push / email / digest | Sprint 10 (FS-28) |
| US-4 | Compliance dashboard — cross-reporter pattern view | Sprint 10 (FS-27) |
| US-5 | Analytics — charts: incidents over time, CAPA trend, SLA trend | Sprint 10 |
| US-6 | User management — Admin can create, deactivate, and reassign users | Sprint 9 |
| US-7 | QR code entry — scan → pre-fill incident form | Sprint 9 (FS-26) |
| US-8 | Offline sync — report without internet, sync on reconnect | Sprint 9 (FS-25) |

---

## 11. Non-Functional Requirements

### Performance
- `GET /approver/queue` — responds in < 300ms for up to 500 open incidents.
- `GET /dashboard/executive` — responds in < 2 seconds.
- Angular initial bundle — loads fully in < 3 seconds on a 10Mbps connection.
- Hangfire SLA check job — runs every 5 minutes; completes within 30 seconds.

### Security
- All endpoints require JWT Bearer authentication except `POST /auth/login` and `GET /health`.
- Role-based policies enforced at controller and command-handler level.
- `approval_events` and `incident_state_log` rows: DB-level `REVOKE UPDATE, DELETE` for the application role.
- File uploads: SHA-256 hash stored, max 6MB, allowed MIME types only (image/jpeg, image/png, application/pdf).
- Passwords: ASP.NET Core Identity default (PBKDF2, 100k iterations).

### Availability
- Single-factory, on-premise deployment. No SLA guarantee required for pilot.
- Hangfire jobs are durable — survive process restart without losing job state.
- PostgreSQL: daily backup (not in scope of application code).

### Accessibility
- WCAG 2.1 AA target for Reporter submission form and Approver queue.
- Colour is never the only indicator (badges include text labels, not just colour).
- All critical actions are keyboard-accessible.

### Localisation
- UI supports English (MVP).
- Backend API returns error messages in English.
- Bangla-first reporting planned for Sprint 9 (i18n hook exists in Angular shell).

---

## 12. RBAC — Roles and Permissions

| Role | Seeded from Day 1 | Active in MVP |
|------|-------------------|---------------|
| `REPORTER` | ✅ | ✅ |
| `APPROVER` | ✅ | ✅ |
| `RESOLVER` | ✅ | ✅ |
| `MANAGER` | ✅ | Sprint 7 |
| `PLANT_MANAGER` | ✅ | Sprint 7 |
| `SAFETY_OFFICER` | ✅ | Sprint 7 |
| `COMPLIANCE_OFFICER` | ✅ | Sprint 8 |
| `ADMIN` | ✅ | Sprint 9 |
| `GUEST` | ✅ | Sprint 9 |

### Key Permission Rules

| Action | Who can do it |
|--------|---------------|
| Submit incident | REPORTER, APPROVER, RESOLVER (on-behalf) |
| View approver queue | APPROVER |
| Claim / decide | APPROVER |
| View assigned incidents | RESOLVER |
| Mark Resolved | RESOLVER |
| Submit approval vote | MANAGER, PLANT_MANAGER, SAFETY_OFFICER, COMPLIANCE_OFFICER |
| View executive dashboard | MANAGER, PLANT_MANAGER, SAFETY_OFFICER |
| View full audit timeline | COMPLIANCE_OFFICER |
| Unmask confidential identity | COMPLIANCE_OFFICER, SAFETY_OFFICER (logged) |
| Manage users | ADMIN |

---

## 13. Constraints and Boundaries

| Constraint | Detail |
|------------|--------|
| Single factory | No multi-tenant schema; one PostgreSQL database, one deployment |
| On-premise | No cloud dependency; local file storage in MVP (behind `IFileStorageService` abstraction) |
| No SMS/Email in MVP | Notification delivery is in-app only until Sprint 10 |
| Severity as INT | Stored as SMALLINT 1–4; all labels are presentation projections, never stored |
| State machine is the only writer | Only `IIncidentStateMachine.TransitionAsync()` writes `Incident.Status` — no direct assignment anywhere |
| Approval events are immutable | DB-level deny on UPDATE/DELETE; no soft-delete, no admin override |
| Department as VARCHAR | No FK to a `departments` table in MVP; deviation documented in entity |

---

## 14. Out of Scope (MVP)

| Feature | Notes |
|---------|-------|
| Offline sync (PWA) | Deferred to Sprint 9 (FS-25) |
| QR code entry | Deferred to Sprint 9 (FS-26) |
| Compliance dashboard | Deferred to Sprint 10 (FS-27) |
| Real push / email notifications | Deferred to Sprint 10 (FS-28) |
| Multi-factory / multi-tenant | Not planned for pilot |
| Mobile native app | Web responsive only |
| AI root-cause suggestion | Stubbed UI only (no backend) |
| Bangla-first UI | Sprint 9+ |
| Anonymous / confidential reporting | Sprint 8 (FS-24) |
| User management UI | Sprint 9 |
| SLA threshold configuration UI | Deferred |
| Workflow routing rules UI | Deferred |
