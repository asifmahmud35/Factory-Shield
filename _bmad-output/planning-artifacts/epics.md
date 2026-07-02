---
stepsCompleted: ['requirements-extraction', 'epic-design', 'story-generation', 'final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prds/prd-Factoryshield-2026-07-02/prd.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-Factoryshield-2026-07-02/ARCHITECTURE-SPINE.md'
  - 'docs/stories/FS-00.md'
  - 'docs/stories/FS-00b.md'
  - 'docs/stories/FS-01.md'
  - 'docs/stories/FS-02.md'
  - 'docs/stories/FS-03.md'
  - 'docs/stories/FS-03b.md'
  - 'docs/stories/FS-04.md'
  - 'docs/stories/FS-05.md'
  - 'docs/stories/FS-06.md'
  - 'docs/stories/FS-07.md'
  - 'docs/stories/FS-08.md'
  - 'docs/stories/FS-09.md'
  - 'docs/stories/FS-10.md'
  - 'docs/stories/FS-11.md'
  - 'docs/stories/FS-12.md'
  - 'docs/stories/FS-13.md'
  - 'docs/stories/FS-14.md'
  - 'docs/stories/FS-14b.md'
  - 'docs/stories/FS-15.md'
  - 'docs/stories/FS-Auth-Extended.md'
---

# Factoryshield - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Factoryshield, decomposing the requirements from the PRD and Architecture spine into implementable stories. This is a **brownfield backfill**: every FR below is already built and shipped (see `docs/stories/FS-*.md` for the original, already-`Done` story files this maps to) — the epics below organize that existing work into BMAD's tracked shape rather than specifying new work.

## Requirements Inventory

### Functional Requirements

**5.1 Reporting (Reporter)**
- FR1: Submit a quick incident report (category, severity, description, location)
- FR2: Attach photo, voice note, or supporting evidence to a report
- FR3: View confirmation and simple status after submitting
- FR4: Report offline and sync later when connectivity returns
- FR5: Report anonymously or confidentially, with identity masked from non-authorized roles
- FR6: Report with location or QR-assisted context
- FR7: Report on behalf of another worker
- FR8: Provide additional information when an Approver requests it (resumes a paused SLA clock)

**5.2 Review & Triage (Approver)**
- FR9: View and filter the incoming review queue, sorted by urgency
- FR10: Claim an incident before acting on it, preventing double-work by another Approver
- FR11: Review full incident detail and attached evidence
- FR12: Approve an incident and hand it off to a Resolver with a note
- FR13: Reject an incident, Soft (reporter can revise) or Hard (terminal)
- FR14: Reassign an incident's category or severity, with loop protection
- FR15: Escalate an incident manually, or have it auto-escalate on SLA breach
- FR16: Merge duplicate incident reports into one
- FR17: Request more information from the Reporter, pausing the SLA clock until they respond
- FR18: Receive staged SLA warnings (before breach) without notification fatigue
- FR19: View a full audit trail of every Approver decision on an incident

**5.3 Investigation & Resolution (Resolver)**
- FR20: View only incidents assigned to me, sorted by SLA urgency
- FR21: Open an assigned incident and see full detail plus the Approver's handoff note
- FR22: Complete a structured investigation checklist with live completion tracking
- FR23: Add timestamped, append-only timeline events (including evidence uploads) during investigation
- FR24: Record root cause analysis (methodology, findings, lessons learned)
- FR25: Create and track one or more Corrective Actions (CAPA) with owner, deadline, completion %
- FR26: Mark an incident Resolved once CAPA prerequisites are met
- FR27: Escalate an incident I cannot resolve alone, without losing it from my queue

**5.4 Governance & Executive Oversight**
- FR28: Submit an approval vote at a governance gate (CLOSE_INVESTIGATION, ROOT_CAUSE_SIGN_OFF, CAPA_VERIFICATION, RESOLUTION_FINAL)
- FR29: Require two independent, distinct actors to approve each gate before the pipeline advances (dual-control)
- FR30: Enforce Separation of Duties — the same actor cannot approve two consecutive gates on one incident
- FR31: View a "Pending Approvals" queue of incidents currently blocked on my vote
- FR32: View an Executive Dashboard KPI scorecard, filterable by date range
- FR33: View the complete, role-scoped, append-only timeline of every action taken on an incident

**5.5 Compliance & Analytics**
- FR34: Maintain a full, append-only audit log of every state-changing action
- FR35: Unmask a Reporter's identity for authorized, logged reasons
- FR36: Deliver real notifications (push / email / digest), not just in-app
- FR37: View a cross-reporter compliance/pattern dashboard
- FR38: View analytics charts (incidents over time, CAPA trend, SLA trend, department breakdown)
- FR39: Manage users — create, deactivate, reassign roles (Admin)
- FR40: Automatic escalation on SLA breach, with a second-level escalation if unacknowledged

### NonFunctional Requirements

- NFR1 (Performance): Approver queue responds < 300ms up to 500 open incidents.
- NFR2 (Performance): Executive Dashboard responds < 2 seconds.
- NFR3 (Performance): Angular initial bundle loads fully in < 3 seconds on a 10Mbps connection.
- NFR4 (Performance): SLA background check job completes within its 5-minute cycle.
- NFR5 (Security): All endpoints require authentication except login/health.
- NFR6 (Security): Role-based policy enforcement at both API and command-handler level.
- NFR7 (Security): Approval and audit-log records are immutable at the database level — no update, no delete, no admin override.
- NFR8 (Security): File uploads are hash-verified (SHA-256), size-capped (6MB), and MIME-type restricted.
- NFR9 (Availability): Single-factory, on-premise pilot; background jobs must be durable across process restarts.
- NFR10 (Accessibility): WCAG 2.1 AA target for the Reporter form and Approver queue; colour is never the sole status indicator; all critical actions are keyboard-accessible.
- NFR11 (Localisation): English at launch; Bangla-first reporting planned post-launch.

### Additional Requirements

_From `ARCHITECTURE-SPINE.md` — no starter template applies (brownfield, codebase already scaffolded; see FS-00 "Project Skeleton", already Done)._

- AD-1: One-directional backend dependency flow (Domain → Application → Infrastructure → Api) must be preserved by every new story.
- AD-2: Every write/read goes through a MediatR Command/Query + Handler — no business logic in controllers.
- AD-3: `Incident.Status` has exactly one writer (`IIncidentStateMachine`) — no story may assign it directly.
- AD-4: FluentValidation validators must be explicitly registered in `Program.cs`, never assembly-scanned.
- AD-5: Every role-gated capability needs matching backend policy AND frontend gate — stories touching RBAC must implement both sides.
- AD-6: SignalR auth travels via query-string JWT, not the Authorization header.
- AD-7: `approval_events` and `incident_state_log` are immutable at the database level.
- AD-8: Severity is stored as an integer; labels are presentation-layer only.
- AD-9: Frontend stories use Angular standalone components + signals + `@if`/`@for` only.
- AD-10: Charting stories must use the existing `ChartComponent` (apexcharts core) — never `ng-apexcharts`.
- AD-11: Time-triggered backend stories use a Hangfire recurring job, not an ad-hoc timer.
- Deferred (not story-worthy yet): Department-as-FK migration, automated test suite, containerization/multi-env topology, multi-tenant support.

### UX Design Requirements

_No UX design contract exists for this project (`bmad-ux` has not been run). Skipped — visual/interaction conventions are instead captured informally in `_bmad-output/project-context.md` (GenieERP-derived design tokens, role-based UI gating patterns)._

### FR Coverage Map

| FR | Epic |
|---|---|
| FR1–FR8 | Epic 1 — Reporting an Incident |
| FR9–FR19 | Epic 2 — Reviewing and Approving an Incident |
| FR20–FR27 | Epic 3 — Investigating and Resolving an Incident |
| FR28–FR33 | Epic 4 — Dual-Control Approval and Executive Oversight |
| FR34–FR40 | Epic 5 — Compliance, Analytics, and Notifications |

## Epic List

### Epic 1: Reporting an Incident
A factory worker/supervisor can report a safety or operational incident in under 60 seconds, with evidence attached, and track its status. **Standalone:** the complete reporting flow; does not depend on any later epic.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8

### Epic 2: Reviewing and Approving an Incident
An Approver triages, claims, classifies, and hands off every incoming incident to a Resolver — without double-work or SLA blindness. **Standalone:** consumes Epic 1's data but is a fully functional review pipeline on its own.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Epic 3: Investigating and Resolving an Incident
A Resolver investigates a handed-off incident, determines root cause, creates Corrective Actions (CAPA), and marks it resolved. **Standalone:** builds on Epic 1+2 but the resolution pipeline is complete on its own.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 4: Dual-Control Approval and Executive Oversight
High-severity incidents require dual-control approval gates (two independent actors), and Executives/Safety Officers get a KPI dashboard without opening individual tickets. **Standalone:** a governance layer over Epic 1-3's incident lifecycle, fully functional on its own.
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR33

### Epic 5: Compliance, Analytics, and Notifications
Compliance Officers/Admins can audit every action in the system, view cross-incident patterns, and users receive real notifications. **Standalone:** a reporting/audit layer over all prior epics' data.
**FRs covered:** FR34, FR35, FR36, FR37, FR38, FR39, FR40

---

## Epic 1: Reporting an Incident

A factory worker/supervisor can report a safety or operational incident in under 60 seconds, with evidence attached, and track its status.
**FRs covered:** FR1–FR8 · **Source:** maps 1:1 to existing `docs/stories/FS-00.md`, `FS-00b.md`, `FS-01.md`, `FS-02.md`, `FS-03.md`, `FS-03b.md`, `FS-Auth-Extended.md` (all status: Done)

### Story 1.1: Project Skeleton *(= FS-00, Done)*
As a developer, I want both the .NET backend and Angular frontend scaffolded and connected to PostgreSQL, so that every subsequent story has a working pipe to build on.
**Acceptance Criteria:**
**Given** a fresh clone, **when** the backend and frontend are started, **then** the Angular app successfully calls a health endpoint on the .NET API and the API connects to PostgreSQL.

### Story 1.2: Authentication *(= FS-00b + FS-Auth-Extended, Done)*
As a user, I want to log in with email/password and receive a role-bearing session, so that every later feature can trust who I am and what I'm allowed to do.
**Acceptance Criteria:**
**Given** valid credentials, **when** I submit the login form, **then** I receive a JWT carrying my role claim and am redirected to my role's dashboard.
**And** invalid credentials return a clear error without revealing whether the email or password was wrong.

### Story 1.3: Submit a Quick Incident Report *(= FS-01, Done — FR1)*
As a Reporter, I want to submit a quick incident report with category, severity, description, and location, so that the issue is captured immediately.
**Acceptance Criteria:**
**Given** I am logged in, **when** I fill the report form and submit, **then** an incident is created with status `SUBMITTED`, a generated `incident_reference` (`INC-{YYYY}-{NNNN}`), and I see a confirmation.

### Story 1.4: Add Evidence *(= FS-02, Done — FR2)*
As a Reporter, I want to attach a photo or file to my report, so that reviewers have visual context.
**Acceptance Criteria:**
**Given** an incident I created, **when** I upload a file under 6MB of an allowed MIME type, **then** it is stored, hash-verified, and linked to the incident.
**And** a file over the limit or of a disallowed type is rejected with a clear message.

### Story 1.5: My Incidents / Status View *(= FS-03, Done — FR3)*
As a Reporter, I want to see a list of incidents I've submitted with their current status, so that I know what's happening without asking anyone.
**Acceptance Criteria:**
**Given** I have submitted incidents, **when** I open "My Incidents", **then** I see each one's reference, category, severity, and current `display_status` label.

### Story 1.6: Basic Frontend Styling Pass *(= FS-03b, Done)*
As a Reporter, I want the reporting and status screens to be visually clear and consistent, so that the tool feels trustworthy on a factory-floor device.
**Acceptance Criteria:**
**Given** any Reporter-facing screen, **when** viewed on desktop or mobile width, **then** layout, spacing, and status colors are consistent with the shared design tokens.

*(FR4 Offline sync, FR5 Confidential reporting, FR6 QR/location context, FR7 report-on-behalf: status Ready/Planned per PRD — no dedicated FS story file exists yet for these; see Epic 5 Deferred note and PRD §9 Out of Scope.)*

---

## Epic 2: Reviewing and Approving an Incident

An Approver triages, claims, classifies, and hands off every incoming incident to a Resolver — without double-work or SLA blindness.
**FRs covered:** FR9–FR19 · **Source:** maps to `docs/stories/FS-04.md`, `FS-05.md`, `FS-14.md`, `FS-14b.md`, `FS-15.md` (all Done)

### Story 2.1: Approver Review Queue *(= FS-04, Done — FR9, FR10)*
As an Approver, I want to see and claim incoming incidents from a shared queue, so that two Approvers never duplicate work on the same incident.
**Acceptance Criteria:**
**Given** unclaimed `SUBMITTED` incidents exist, **when** I open the queue, **then** they are sorted by urgency (severity, then age).
**And** claiming an incident locks it to me; another Approver sees it as claimed.

### Story 2.2: Approve/Reject Incident *(= FS-05, Done — FR11, FR12, FR13, FR14, FR16, FR17)*
As an Approver, I want to review an incident's detail and either approve (with handoff note and Resolver assignment), reject (soft or hard), reassign, merge as duplicate, or request more info, so that every incident gets a clear, correct decision.
**Acceptance Criteria:**
**Given** a claimed incident, **when** I approve it, **then** it transitions to `TRIAGED`/`ASSIGNED` with my handoff note visible to the Resolver.
**And** a Hard reject is terminal; a Soft reject returns it to the Reporter for revision.
**And** requesting more info pauses the SLA clock until the Reporter responds.

### Story 2.3: SLA Engine — Lean Slice *(= FS-14, Done — FR18)*
As an Approver, I want staged SLA warnings before a breach, so that I don't miss a deadline without fatigue-inducing spam.
**Acceptance Criteria:**
**Given** an incident's SLA clock is running, **when** elapsed time crosses the warning threshold, **then** a single staged warning fires (not a warning per poll).

### Story 2.4: SLA Notifications via Hangfire *(= FS-14b, Done — FR18)*
As an Approver, I want SLA checks to run reliably in the background, so that warnings fire even if no one has the page open.
**Acceptance Criteria:**
**Given** the Hangfire recurring job is scheduled, **when** it runs every 5 minutes, **then** it evaluates all open incidents' SLA state and persists any newly-crossed thresholds.

### Story 2.5: Escalation — Manual + SLA Auto *(= FS-15, Done — FR15)*
As an Approver, I want to escalate an incident manually, or have it auto-escalate on SLA breach, so that stuck incidents always reach someone who can act.
**Acceptance Criteria:**
**Given** an incident breaches its SLA, **when** the SLA job detects it, **then** an `SLA_AUTO` escalation is created and the appropriate role is notified.
**And** an Approver can also trigger a `MANUAL` escalation with a reason.

*(FR19 Approver audit trail: status Done per `docs/PROJECT_STATUS.md`, but has no dedicated FS-*.md story file — see Epic 4/5 provenance note below.)*

---

## Epic 3: Investigating and Resolving an Incident

A Resolver investigates a handed-off incident, determines root cause, creates Corrective Actions (CAPA), and marks it resolved.
**FRs covered:** FR20–FR27 · **Source:** maps to `docs/stories/FS-06.md` through `FS-13.md` (all Done)

### Story 3.1: Resolver Assigned Incidents Dashboard *(= FS-06, Done — FR20)*
As a Resolver, I want to see only incidents assigned to me, sorted by SLA urgency, so that I focus on the right thing first.
**Acceptance Criteria:**
**Given** I am logged in as a Resolver, **when** I open my dashboard, **then** I see only incidents where I am the assigned Resolver, in `ASSIGNED`/`IN_PROGRESS` status, sorted by SLA stage.

### Story 3.2: Open Investigation Workspace *(= FS-07, Done — FR21)*
As a Resolver, I want to open an assigned incident and see full detail plus the Approver's handoff note, so that I understand what I'm being asked to fix.
**Acceptance Criteria:**
**Given** I open an assigned incident, **when** the workspace loads, **then** I see category, severity, description, attachments, and the handoff note, and status auto-transitions `ASSIGNED → IN_PROGRESS`.

### Story 3.3: Save Investigation Details *(= FS-08, Done — FR23, FR24)*
As a Resolver, I want to save investigation notes, findings, and root cause fields as I work, so that partial progress is never lost.
**Acceptance Criteria:**
**Given** I edit any investigation field, **when** I save, **then** it persists and reappears on next open.

### Story 3.4: Investigation Checklist Toggle *(= FS-09, Done — FR22)*
As a Resolver, I want to check off structured investigation checklist items with live completion tracking, so that the inquiry is systematic.
**Acceptance Criteria:**
**Given** I toggle a checklist item, **when** the change saves, **then** completion percentage updates immediately and persists.

### Story 3.5: Evidence Panel *(= FS-10, Done — FR23)*
As a Resolver, I want to view and upload evidence during the investigation, so that findings are backed by proof.
**Acceptance Criteria:**
**Given** I upload evidence during investigation, **when** it saves, **then** it appears as an append-only timeline event with uploader and timestamp.

### Story 3.6: CAPA — Create & Track Corrective Actions *(= FS-11, Done — FR25)*
As a Resolver, I want to create Corrective Actions with owner, deadline, and completion %, so that the root cause is systematically fixed.
**Acceptance Criteria:**
**Given** the investigation phase is complete, **when** I add a CAPA task, **then** I can update its completion % and mark it Verified at 100%.

### Story 3.7: Resolve Incident *(= FS-12, Done — FR26)*
As a Resolver, I want to mark an incident Resolved once CAPA prerequisites are met, so that the pipeline closes cleanly.
**Acceptance Criteria:**
**Given** at least one CAPA task is Verified, **when** I click Mark Resolved, **then** status becomes `RESOLVED` (or `VERIFICATION` for L3/L4 severity per Epic 4) and the SLA clock stops.

### Story 3.8: AI Root Cause Assistant (Stub) *(= FS-13, Done)*
As a Resolver, I want an AI-assist entry point for root cause suggestions, so that the UI is ready for a future model without blocking on one today.
**Acceptance Criteria:**
**Given** I open the AI Root Cause panel, **when** no backend model is wired up, **then** I see a clear "coming soon" state rather than a broken control.

*(FR27 Escalate/request assistance as a Resolver: covered by the same escalation mechanism as Story 2.5 — no separate FS file.)*

---

## Epic 4: Dual-Control Approval and Executive Oversight

High-severity incidents require dual-control approval gates (two independent actors), and Executives/Safety Officers get a KPI dashboard without opening individual tickets.
**FRs covered:** FR28–FR33 · **Provenance note:** ⚠️ no `docs/stories/FS-*.md` file exists for this epic — `docs/SPRINT_PLANNING.md` confirms the functionality shipped in Sprint 7 but flags "story files not created" as a known documentation gap. The stories below are **newly backfilled** from the PRD/architecture, describing already-built behavior for the first time in story form.

### Story 4.1: Submit an Approval Vote at a Governance Gate (New backfill — FR28, FR29)
As an authorized approver (Manager/Plant Manager/Safety/Compliance Officer), I want to submit an approval or rejection vote at a governance gate, so that high-severity incidents advance only when two independent actors agree.
**Acceptance Criteria:**
**Given** an incident is at a gated stage (`CLOSE_INVESTIGATION`, `ROOT_CAUSE_SIGN_OFF`, `CAPA_VERIFICATION`, or `RESOLUTION_FINAL`), **when** I approve, **then** my vote is recorded with actor, role, and timestamp.
**And** the pipeline does not advance until a second, distinct actor also approves.
**And** rejecting returns the incident to the previous stage.

### Story 4.2: Separation of Duties Enforcement (New backfill — FR30)
As a compliance system, I want to block the same actor from approving two consecutive gates on one incident, so that no single person can unilaterally progress a high-severity case.
**Acceptance Criteria:**
**Given** actor X approved one gate, **when** actor X attempts to be the second approver on the immediately following gate for the same incident, **then** the API rejects it as a Separation-of-Duties violation.

### Story 4.3: Pending Approvals Queue (New backfill — FR31)
As a Manager/Safety Officer, I want to see which incidents currently need my approval, so that I never miss a gate that's blocking resolution.
**Acceptance Criteria:**
**Given** incidents are waiting on my vote, **when** I open Pending Approvals, **then** I see them sorted by severity then age, with gate type and who else has approved.

### Story 4.4: Executive Dashboard KPI Scorecard (New backfill — FR32)
As a Plant Manager/Safety Officer, I want a single-page KPI view, so that I understand factory incident health without opening individual tickets.
**Acceptance Criteria:**
**Given** I open the Executive Dashboard, **when** it loads, **then** I see open-incident counts by severity/status/department, average resolution time, SLA breach count, and CAPA completion rate, filterable by date range.

### Story 4.5: Incident Timeline View (New backfill — FR33)
As a Manager/Compliance Officer, I want to view the complete, role-scoped, ordered timeline of every action on an incident, so that I can reconstruct its full lifecycle.
**Acceptance Criteria:**
**Given** I open an incident's timeline, **when** my role is Reporter, **then** I see only PUBLIC-scoped events; **when** my role is Compliance Officer, **then** I see all events including RESTRICTED scope.

---

## Epic 5: Compliance, Analytics, and Notifications

Compliance Officers/Admins can audit every action in the system, view cross-incident patterns, and users receive real notifications.
**FRs covered:** FR34–FR40 · **Provenance note:** ⚠️ same gap as Epic 4 — these map to Sprint 8–10 work (FS-23 through FS-29 in the sprint plan) that was implemented but never got individual story files under `docs/stories/`. Backfilled below from PRD/architecture + `docs/PROJECT_STATUS.md`.

### Story 5.1: Full Incident State Log (New backfill — FR34)
As a Compliance Officer, I want every state-changing action to write an append-only audit row, so that regulators can always answer "what happened and who acted?"
**Acceptance Criteria:**
**Given** any state-changing action occurs, **when** it completes, **then** an `incident_state_log` row is written and can never be updated or deleted (DB-level enforced).

### Story 5.2: Identity Unmask with Access Logging (New backfill — FR35)
As a Compliance/Safety Officer, I want to unmask a confidential Reporter's identity for an authorized, logged reason, so that investigations can proceed without permanently exposing the Reporter.
**Acceptance Criteria:**
**Given** I submit an unmask request with a reason, **when** authorized, **then** I see the Reporter's email and an `IdentityAccessAudit` row is written for the access itself.

### Story 5.3: Real Notification Delivery (New backfill — FR36, status: Ready)
As any role, I want to receive notifications via more than just in-app banners, so that I don't miss time-sensitive events while away from the screen.
**Acceptance Criteria:**
**Given** a notifiable event occurs, **when** delivery fires, **then** it is sent in-app and (per user preference) digested rather than spamming one-at-a-time.
*Note: email/SMS transport currently uses `DevEmailService`/`DevSmsService` stubs — real external delivery is a deferred follow-up, not yet production-wired.*

### Story 5.4: Compliance Dashboard (New backfill — FR37)
As a Compliance Officer, I want a cross-reporter, cross-incident pattern view, so that I can spot systemic issues rather than one-off incidents.
**Acceptance Criteria:**
**Given** I open the Compliance Dashboard, **when** it loads, **then** I see repeat-failure and dispute-pattern panels aggregated across incidents, not just one at a time.

### Story 5.5: Analytics Charts (New backfill — FR38)
As a Manager, I want charts for incidents-over-time, CAPA trend, and SLA trend, so that I can see direction, not just a snapshot.
**Acceptance Criteria:**
**Given** I open Analytics, **when** the page loads, **then** I see the trend charts rendered from real incident data (never fabricated placeholder data), filterable by date range.

### Story 5.6: User Management (New backfill — FR39, status: Planned)
As an Admin, I want to create, deactivate, and reassign user roles, so that account lifecycle doesn't require direct database access.
**Acceptance Criteria:**
**Given** I am an Admin, **when** I deactivate a user, **then** they can no longer log in, and their historical actions remain attributed and unaltered.
*Note: status is Planned, not yet built — this story is the first to actually specify net-new work rather than backfill existing behavior.*

### Story 5.7: Second-Level Escalation on Non-Acknowledgment (New backfill — FR40)
As a Safety Officer, I want an unacknowledged Level-1 escalation to automatically escalate further, so that a stuck incident can't be ignored indefinitely.
**Acceptance Criteria:**
**Given** an L1 escalation remains unacknowledged for 48 hours, **when** the escalation job runs, **then** it auto-escalates to L2 and notifies the Safety Officer role.

---

**Requirements coverage check:** all 40 FRs (FR1–FR40) are covered by at least one story above. NFR1–NFR11 and AD-1–AD-11 apply cross-cutting to every story in every epic (not restated per-story) — see Requirements Inventory.
