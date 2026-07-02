# FactoryShield — Full Sprint Planning
**BMAD Phase 3: Story Sharding & Sprint Planning | Author: Asif | Date: 2026-07-01**
**Input:** FULL_ARCHITECTURE.md · Epic 1 · Epic 2 · Governance Spec · Figma (Investigation Workspace)**

---

## How to Read This Document

Each sprint has:
- **Goal** — one sentence on what the sprint proves works end-to-end
- **Stories** — ordered by dependency; earlier stories unblock later ones within the same sprint
- **Points** — effort estimate using Fibonacci (1 = trivial, 3 = half-day, 5 = full day, 8 = 1.5 days, 13 = 2+ days)
- **Status** — `Done` / `In Progress` / `Ready` / `Blocked`

**Velocity baseline (from Sprint 0–2):** ~18 points per sprint. Used as the capacity ceiling for upcoming sprints.

**Dependency notation:** `⬆ FS-XX` = this story is blocked until FS-XX is Done.

**Last verified against running code:** 2026-07-01 — Sprints 0–11 confirmed fully implemented; Sprint 10 completed (all 3 remaining sub-pieces finished: `GET /compliance/identity-access-audit`, `GET /compliance/export/{incidentId}`, FS-29 Approver Audit Trail). See `docs/API_PLAN.md` for endpoint-level status and `docs/PROJECT_STATUS.md` for the E2E smoke-test log.

---

## Sprint 0 — Foundation ✅ COMPLETE

**Goal:** Both apps compile, connect to Postgres, and prove end-to-end HTTP pipe.
**Dates:** Day 0 | **Total Points:** 13

| # | Story | Title | Points | Status |
|---|---|---|---|---|
| FS-00 | Foundation | Project skeleton — 4-project solution, EF Core, health endpoint, Angular shell | 8 | ✅ Done |
| FS-00b | Foundation | Auth — JWT login, seed 3 demo users, `role.guard`, `auth.interceptor` | 5 | ✅ Done |

### Sprint 0 Definition of Done
- [x] `dotnet build` passes all 4 projects
- [x] `ng serve` loads at localhost:4200
- [x] `GET /api/v1/health` returns 200 from Angular
- [x] JWT login returns token; protected routes redirect to `/login` when unauthenticated

---

## Sprint 1 — Reporter MVP ✅ COMPLETE

**Goal:** A Reporter can submit an incident with a photo, view their submitted list, and see a styled UI.
**Total Points:** 18

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-01 | Epic 1 US-2 | Submit incident — `POST /incidents`, INC-reference, state machine stub | 5 | ✅ Done | FS-00b |
| FS-02 | Epic 1 US-3 | Upload attachment — `POST /incidents/{id}/attachments`, 6MB, SHA-256 | 5 | ✅ Done | FS-01 |
| FS-03 | Epic 1 US-7 | My Incidents list — `GET /incidents/mine`, `display_status` projection | 3 | ✅ Done | FS-01 |
| FS-03b | Visual | Frontend styling pass — CSS design system, shell layout, status badge | 5 | ✅ Done | FS-03 |

### Sprint 1 Definition of Done
- [x] Reporter can login → submit incident → upload photo → view list with status badge
- [x] All 6 ACs verified for FS-01, FS-02, FS-03
- [x] Consistent visual style across all 4 Reporter pages

---

## Sprint 2 — Approver Workflow ✅ COMPLETE

**Goal:** An Approver can see the incident queue, drill into a detail, and approve or reject with a Resolver assignment.
**Total Points:** 13

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-04 | Epic 2 US-1 | Approver queue — `GET /approver/queue`, sorted by severity + age, role guard | 5 | ✅ Done | FS-01 |
| FS-05 | Epic 2 US-4/5 | Approve / Reject — `POST /incidents/{id}/approve`, `POST /incidents/{id}/reject`, Resolver dropdown | 8 | ✅ Done | FS-04 |

### FS-05 Tasks (for Dev to pick up)
**Backend:**
- [ ] `ApprovalDecision` enum already exists → extend `IIncidentStateMachine` to handle `SUBMITTED → TRIAGED` (approve) and `SUBMITTED → REJECTED` (reject)
- [ ] `ApproveIncidentCommand` + Handler — accepts `incidentId`, `resolverUserId`; stores `AssignedResolverId`; transitions via state machine
- [ ] `RejectIncidentCommand` + Handler — accepts `incidentId`, `rejectType` (Soft/Hard), `reason`; FluentValidation: reason ≥ 10 chars
- [ ] `ApproverController.Approve` — `POST /api/v1/incidents/{id}/approve` (already scaffolded)
- [ ] `ApproverController.Reject` — `POST /api/v1/incidents/{id}/reject` (already scaffolded)
- [ ] `GetResolversQuery` — list users with RESOLVER role for the dropdown

**Frontend:**
- [ ] Extend `incident-detail-stub.component.ts` — Approve button + Resolver dropdown; Soft/Hard Reject buttons + reason textarea (10-char counter)
- [ ] `incident.service.ts` — `approveIncident()`, `rejectIncident()` (already stubbed)
- [ ] On success: navigate to `/approver/queue` (auto-refresh shows updated queue)

### Sprint 2 Definition of Done
- [x] FS-05 AC1: Approve → TRIAGED, Resolver assigned, removed from queue
- [x] FS-05 AC3/4: Soft Reject → REJECTED (dispute window), Hard Reject → final
- [x] FS-05 AC4b: reason < 10 chars → HTTP 400
- [x] FS-05 AC5: Approve button shows Resolver dropdown; Reject shows reason textarea

---

## Sprint 3 — Investigation Workspace ✅ COMPLETE

**Goal:** An assigned Resolver can open the Investigation Workspace for an incident, fill in all fields shown in the Figma design, check off the 8-item checklist, and see the auto-populated timeline.
**Total Points:** 21

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-06 | Resolver US-1 | Resolver: Assigned Incidents list — `GET /resolver/assigned`, filtered + sorted | 3 | ✅ Done | ⬆ FS-05 |
| FS-07 | Figma + Governance | Open Investigation — `POST /incidents/{id}/investigation`, creates Investigation + 8 checklist items + 1 timeline event | 8 | ✅ Done | ⬆ FS-06 |
| FS-08 | Figma | Save Investigation Details — `PUT /incidents/{id}/investigation`, updates notes/findings/risk/dates/owner | 5 | ✅ Done | ⬆ FS-07 |
| FS-09 | Figma | Checklist toggle — `POST /incidents/{id}/investigation/checklist/{itemId}/toggle`, shows N/8 counter | 3 | ✅ Done | ⬆ FS-07 |
| FS-10 | Figma | Evidence panel — reuse existing `POST /incidents/{id}/attachments`; display list in Investigation Workspace | 2 | ✅ Done | ⬆ FS-07 |

### FS-06 Tasks
**Backend:**
- [ ] `ResolverController` — `GET /api/v1/resolver/assigned` (`[Authorize(Policy = "ResolverOnly")]`), returns assigned incidents (status: TRIAGED/ASSIGNED/IN_PROGRESS)
- [ ] `GetAssignedIncidentsQuery` + Handler — include `line`, `equipment`, `reporterName`, `incidentReference` in response DTO (Epic 2 Final §US-1 Update #2, #4)
- [ ] Query params: `?severity=&department=&line=&equipment=&status=&dueBefore=` — all optional filters (Update #2)
- [ ] Register `ResolverOnly` policy in `Program.cs` (checks `RESOLVER` role)
- [ ] Ensure `incidents` table has `line VARCHAR`, `equipment VARCHAR`, `reporter_name VARCHAR` columns (denormalized, survives user rename/delete per Epic 2 Final #4); add in migration if missing

**Frontend:**
- [ ] `assigned-dashboard.component.ts` — list cards showing: severity badge (enum: LOW/MEDIUM/HIGH/CRITICAL), status badge (enum: OPEN/IN_PROGRESS/INVESTIGATION/PENDING_APPROVAL/CLOSED/REJECTED), location (line / equipment), reporter name, reference code (INC-{YYYY}-{NNNN}) — per Epic 2 Final AC4
- [ ] Dashboard badge counts: corrective actions requiring attention + pending approvals awaiting submission (Update #1)
- [ ] Filter chips: severity, department, line, equipment, status, due date (Update #2)
- [ ] Route `/resolver/assigned`, `roleGuard` with RESOLVER role
- [ ] `incident.service.ts` — `getAssignedIncidents(filters?)` with optional filter params

### FS-07 Tasks
**Backend (new domain):**
- [ ] `RiskLevel` enum (High=1, Medium=2, Low=3)
- [ ] `Investigation` entity + EF config (1-to-1 with Incident, unique index on IncidentId) — include `ReporterFollowupRequested BOOL DEFAULT false`, `ReporterFollowupResolved BOOL DEFAULT false` (Epic 2 Final US-2 Update #8)
- [ ] `root_cause_code` column on `Investigation` (enum: EQUIPMENT_FAILURE, PROCEDURE_GAP, HUMAN_ERROR, DESIGN_DEFECT, EXTERNAL_FACTOR, UNKNOWN_UNDER_INVESTIGATION) — required before `ResolveIncidentCommand` can proceed (US-2)
- [ ] `root_cause_description VARCHAR(500)` optional free-text on `Investigation`
- [ ] `InvestigationChecklistItem` entity + EF config (cascade delete from Investigation)
- [ ] `InvestigationTimelineEvent` entity + EF config
- [ ] Migration: `AddInvestigation`
- [ ] `IInvestigationRepository` + `InvestigationRepository`
- [ ] `OpenInvestigationCommand` + Handler — creates Investigation; seeds 8 checklist items; adds 1 timeline event "Investigation started"; returns `InvestigationId`
- [ ] `InvestigationController` — `POST /api/v1/incidents/{id}/investigation`
- [ ] Register `IInvestigationRepository` in `Program.cs`

**Frontend:**
- [ ] `investigation-workspace.component.ts` — main container, route `/incidents/:id/investigation`
- [ ] Incident detail header shows `reporter_contact_channel` (or "anonymous" for confidential reports) — per Epic 2 Final US-2 Update #7
- [ ] `investigation.service.ts` — `openInvestigation(incidentId)`
- [ ] "Open Investigation" button on Resolver's incident detail page → calls `openInvestigation()` → navigates to workspace

### FS-08 Tasks
**Backend:**
- [ ] `GetInvestigationQuery` + Handler → returns `InvestigationWorkspaceDto` (owner, dates, risk, notes, findings, immediate action, lessons learned, checklist, timeline, evidence, `reporterFollowupRequested`, `reporterFollowupResolved`)
- [ ] `SaveInvestigationCommand` + Handler — patches provided fields, sets `UpdatedAt = UtcNow`; accepts `rootCauseCode` and `rootCauseDescription` (required before resolve per US-2)
- [ ] `SaveInvestigationCommandValidator` — `rootCauseDescription` optional (≤ 500 chars if provided); all other fields optional on save
- [ ] `InvestigationController` — `GET /incidents/{id}/investigation`, `PUT /incidents/{id}/investigation`

**Frontend:**
- [ ] `investigation-details.component.ts` — inline-edit fields: Notes, Findings Summary, Immediate Action Taken, Lessons Learned, Risk Level (radio: High/Medium/Low), Investigation Date, Target Completion, Owner
- [ ] Root Cause Code selector — dropdown with enum values (EQUIPMENT_FAILURE, PROCEDURE_GAP, HUMAN_ERROR, DESIGN_DEFECT, EXTERNAL_FACTOR, UNKNOWN_UNDER_INVESTIGATION); optional free-text `rootCauseDescription`
- [ ] Reporter follow-up section: "Request Follow-up" toggle (`reporterFollowupRequested`); "Follow-up Resolved" checkbox (`reporterFollowupResolved`) — per Epic 2 Final Update #8
- [ ] Auto-save on blur (or explicit "Save" button)
- [ ] `investigation.service.ts` — `getInvestigation(incidentId)`, `saveInvestigation(incidentId, data)`

### FS-09 Tasks
**Backend:**
- [ ] `ToggleChecklistItemCommand` + Handler — flips `IsCompleted`; if all 8 complete, appends timeline event "All checklist items completed"
- [ ] `ToggleChecklistItemResult { IsCompleted, CompletedCount, TotalCount }`
- [ ] `InvestigationController` — `POST /incidents/{id}/investigation/checklist/{itemId}/toggle`

**Frontend:**
- [ ] `checklist-panel.component.ts` — renders 8 items, "N/8 completed" counter, checkbox toggling
- [ ] Optimistic update: flip locally, revert on error
- [ ] `investigation.service.ts` — `toggleChecklistItem(incidentId, itemId)`

### FS-10 Tasks
**Backend:** No new endpoint — reuse `POST /incidents/{id}/attachments` from FS-02.

**Frontend:**
- [ ] `evidence-panel.component.ts` — drag-and-drop file upload (calls existing `uploadAttachment()`); renders evidence list (type icon, note, uploader name, timestamp)
- [ ] Add `evidence_note` input field on upload dialog

### Sprint 3 Definition of Done
- [x] Resolver can login → see assigned incidents → open investigation workspace
- [x] Workspace loads with 8 unchecked items, empty fields, 1 timeline event
- [x] Resolver can fill and save all text fields; changes persist on reload
- [x] Checking an item increments the "N/8" counter; all 8 checked → timeline event added
- [x] Resolver can upload a photo; it appears in the Evidence panel with note and uploader name
- [x] `GET /incidents/{id}/investigation` returns the full workspace DTO

---

## Sprint 4 — CAPA + Resolution ✅ COMPLETE

**Goal:** A Resolver can create corrective actions for an investigation, track their completion, and mark the incident Resolved.
**Total Points:** 16

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-11 | Resolver US-3/4 | CAPA: Create & track corrective actions | 8 | ✅ Done | ⬆ FS-08 |
| FS-12 | Resolver US-5/6 | Resolve incident — `POST /incidents/{id}/resolve`, status → RESOLVED | 5 | ✅ Done | ⬆ FS-11 |
| FS-13 | Figma stub | AI Root Cause Assistant panel — stub button "Analyze Root Causes" (no logic) | 3 | ✅ Done | ⬆ FS-07 |

### FS-11 Tasks
**Backend:**
- [ ] `CorrectiveAction` entity + EF config + migration `AddCorrectiveActions`
- [ ] `action_status` enum: OPEN, IN_PROGRESS, COMPLETED, CANCELLED, VERIFIED, OVERDUE — per Epic 2 Final US-3
- [ ] `CreateCorrectiveActionCommand` + Handler — `owner` and `due_date` mandatory (US-3 AC2); title, description, priority
- [ ] `UpdateCorrectiveActionCommand` + Handler — completion %, status, `verified_by`, `verified_at`; guard: if `action_status = VERIFIED` → block further edits (immutable, US-3 AC6)
- [ ] `ResolverController` — `POST /incidents/{id}/actions`, `PATCH /actions/{id}`
- [ ] `OverdueActionJob` — Hangfire recurring (every 5 min): if `due_date < NOW()` and `action_status NOT IN (COMPLETED, CANCELLED, VERIFIED)` → set `action_status = OVERDUE`, write timeline event (US-6 AC2)

**Frontend:**
- [ ] `capa-tracker.component.ts` — CAPA list with progress bars, OVERDUE highlight, VERIFIED lock indicator, add-action form with mandatory owner + due date
- [ ] `investigation.service.ts` — `createAction()`, `updateAction()`

### FS-12 Tasks
**Backend:**
- [ ] Extend `IIncidentStateMachine` — `IN_PROGRESS → RESOLVED` transition
- [ ] `ResolveIncidentCommand` + Handler — validation gate (US-5 Final):
  - At least one CAPA action with `action_status IN (COMPLETED, CANCELLED, VERIFIED)` — (previously: any action exists)
  - At least one `attachment` with `upload_status = VALIDATED` — new requirement from Epic 2 Final US-5 AC1
  - `root_cause_code` set on `Investigation` — required per US-2; block with validation message if missing
  - `approval_type` accepted as optional param (CLOSE_INVESTIGATION, CAPA_VERIFICATION, ROOT_CAUSE_SIGN_OFF, RESOLUTION_FINAL) — if approval required per category config, sets `resolution_status = PENDING` not RESOLVED (Epic 2 Final US-5 Update #9/#10)
- [ ] `ResolverController` — `POST /incidents/{id}/resolve` (update request schema to include optional `approvalType`)
- [ ] `POST /incidents/{id}/submit-approval` — `{ approvalType }` — routes to `SubmitApprovalCommand` for the 4-type approval gate (FS-21 reuse)

**Frontend:**
- [ ] "Mark Resolved" button enabled only when: ≥ 1 CAPA in COMPLETED/CANCELLED/VERIFIED state, ≥ 1 VALIDATED evidence, AND `rootCauseCode` is set — per Epic 2 Final US-5 AC1 + US-2
- [ ] If `approval_required = true` for this category: show approval type selector (Close Investigation / CAPA Verification / Root Cause Sign-off / Resolution Final) before submit
- [ ] Validation message when `rootCauseCode` not selected: "Root cause must be identified before resolving" (US-2 AC3)
- [ ] On resolve (no approval): navigate to `/resolver/assigned` (incident disappears from list)
- [ ] On resolve (approval required): navigate to confirmation "Submitted for approval — pending Manager review"

### FS-13 Tasks (stub only)
**Frontend only:**
- [ ] `ai-assistant-panel.component.ts` — card with "Pattern analysis from 2,400+ incidents" subtitle, "Analyze Root Causes" button (disabled, tooltip: "Coming soon")
- [ ] No backend, no API call

### Sprint 4 Definition of Done
- [x] Resolver can add 3 CAPA actions with mandatory owner + due date, update their completion %, mark one verified
- [x] VERIFIED action is locked from further edits (immutable for audit)
- [x] `action_status` auto-transitions to OVERDUE when `due_date < NOW()` (OverdueActionJob)
- [x] "Mark Resolved" button is disabled until: ≥ 1 CAPA in COMPLETED/CANCELLED/VERIFIED, ≥ 1 VALIDATED evidence, AND root_cause_code is set
- [x] Resolving an incident → status becomes RESOLVED (or PENDING if approval required) → disappears from assigned list
- [x] AI panel renders stub with button (no action)

---

## Sprint 5 — SLA Engine + Notifications ✅ COMPLETE

**Goal:** SLA clocks start on incident creation, Approvers see staged warnings (50%/80%), and overdue incidents auto-escalate.
**Total Points:** 18

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-14 | Epic 2 US-7/10 | SLA Engine (lean slice) — `SlaClocks` table, lifecycle start/stop, colour-coded countdown UI (no Hangfire) | 8 | ✅ Done | ⬆ FS-05 |
| FS-14b | Epic 2 US-10 | SLA notifications — Hangfire recurring job, staged warnings (50%/80%/breach), `notifications` table | 5 | ✅ Done | ⬆ FS-14 |
| FS-15 | Epic 2 US-7 | Escalation (manual + SLA auto) — `POST /incidents/{id}/escalate`, Hangfire auto on breach | 5 | ✅ Done | ⬆ FS-14b |

> **Scope note:** FS-14 (lean slice) + FS-14b (Hangfire notifications) are both **Done**. FS-15 is now unblocked. See [stories/FS-14.md](stories/FS-14.md) and [stories/FS-14b.md](stories/FS-14b.md).

### FS-14 Tasks
**Backend:**
- [ ] `SLAClock` entity + EF config + migration `AddSlaClocks`
- [ ] `ISlaEngine` interface + `SlaEngine` service
- [ ] Hangfire setup in `Program.cs` (add package, dashboard at `/hangfire`, recurring job)
- [ ] `SlaCheckJob` — every 5 min; computes elapsed per open clock; fires SLA_WARNING at 50% (once), SLA_CRITICAL at 80% (once); sets BREACHED at 100%
- [ ] On `CreateIncidentCommand` success → start TRIAGE clock; on approve → stop TRIAGE, start ASSIGNMENT; etc.
- [ ] `notifications` table + migration `AddNotifications`

**Frontend:**
- [ ] `sla-countdown.component.ts` — shared component: shows remaining time, colour-coded (green/amber/red) per `stage`
- [ ] Add SLA countdown to Approver queue rows and incident detail header

### FS-15 Tasks
**Backend:**
- [ ] `escalations` table + migration `AddEscalations`
- [ ] `EscalateIncidentCommand` + Handler — manual escalation: increments level, notifies next Approver
- [ ] `SlaCheckJob` extension — on BREACHED: auto-escalate, write `escalations` row, write `incident_state_log` entry with "SLA breached, auto-escalated"
- [ ] `ApproverController` — `POST /incidents/{id}/escalate` (existing stub)

**Frontend:**
- [ ] "Escalate" button on incident detail (Approver view) + reason textarea
- [ ] SLA CRITICAL badge in queue: "!" indicator on overdue rows

### Sprint 5 Definition of Done
- [ ] New incident → SLA clock starts; queue shows countdown
- [ ] At 50% elapsed: one SLA_WARNING notification fires (not repeated)
- [ ] At 80% elapsed: SLA_CRITICAL notification fires; incident turns red in queue
- [ ] At 100%: auto-escalation fires, `escalations` row inserted, incident removed from current Approver's queue
- [ ] Manual escalate: incident moves to next level immediately

---

## Sprint 6 — Advanced Approver Features ✅ COMPLETE

**Goal:** Approvers can claim incidents (no double-work), reassign category/severity with loop protection, merge duplicates, and request info from Reporters.
**Total Points:** 21

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-16 | Epic 2 US-2 | Claim / lock — `POST /incidents/{id}/claim`, auto-release timeout | 5 | ✅ Done | ⬆ FS-15 |
| FS-17 | Epic 2 US-6 | Reassign category/severity + loop guard | 5 | ✅ Done | ⬆ FS-16 |
| FS-18 | Epic 2 US-8 | Merge duplicate incidents | 5 | ✅ Done | ⬆ FS-16 |
| FS-19 | Epic 2 US-9 | Request more info from Reporter — SLA pause | 6 | ✅ Done | ⬆ FS-16 |

### FS-16 Tasks
**Backend:**
- [ ] `IncidentClaim` entity + EF config + migration `AddClaimAndLoopGuard`
- [ ] `ClaimIncidentCommand` + Handler — prevents double-claim
- [ ] `ReleaseClaimCommand` + Handler (manual)
- [ ] Hangfire job extension: auto-release claims after `claim_timeout_minutes` (default 30)
- [ ] `ApproverController` — `POST /incidents/{id}/claim`, `POST /incidents/{id}/release-claim`
- [ ] Approver queue: exclude incidents claimed by other Approvers from actionable list (show as read-only with "Claimed by X")

### FS-17 Tasks
**Backend:**
- [ ] `IncidentRoutingLog` entity + migration (already in `AddClaimAndLoopGuard` migration)
- [ ] `ReassignIncidentCommand` + Handler — updates category/severity, re-routes, increments `reroute_count`
- [ ] Loop guard: if `reroute_count ≥ 2` → block re-route, set `loop_guard_triggered = true`, notify Admin/Compliance
- [ ] `ApproverController` — `POST /incidents/{id}/reassign`

### FS-18 Tasks
**Backend:**
- [ ] `MergeIncidentCommand` + Handler — sets duplicate to `MERGED_CLOSED`, links to primary, carries over attachments
- [ ] `ApproverController` — `POST /incidents/{id}/merge { primaryIncidentId, reason }`

**Frontend:**
- [ ] Merge dialog — search/select primary incident, confirm

### FS-19 Tasks
**Backend:**
- [ ] Status: add `PENDING_REPORTER_INPUT` to state machine
- [ ] `RequestInfoCommand` + Handler — pauses SLA clock; status → PENDING_REPORTER_INPUT
- [ ] `IncidentController` — extend `POST /incidents/{id}/follow-up` (Reporter response) → resumes SLA, returns to Approver queue
- [ ] Timeout job: if no response within configured window → auto-escalate or flag "No Response"

### Sprint 6 Definition of Done
- [x] Two Approvers logged in simultaneously: only one can claim; other sees "Claimed by X"
- [x] Claim auto-releases after 30 min of inactivity (ClaimReleaseJob, Hangfire every 5 min)
- [x] Reassign category → incident re-routes; original values logged in IncidentRoutingLog
- [x] Re-routing the same incident twice → loop guard fires (RouteCount ≥ 2 → LoopGuardTriggered)
- [x] Merge: duplicate shows MergedClosed; linked to primary via MergedIntoId
- [x] Request info: SLA pauses (PausedAt set); Reporter submits via /provide-info → SLA resumes

---

## Sprint 7 — Full 16-State Machine + Governance ✅ COMPLETE

**Goal:** Severity ≥ L2 incidents graduate from IN_PROGRESS into the full INVESTIGATION → RCA_REVIEW → CAPA_EXECUTION → VERIFICATION → RESOLVED → CLOSED pipeline with dual-control approval gates.
**Total Points:** 21

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-20 | Governance §3 | Full 16-state machine — extend `IIncidentStateMachine` to all canonical states | 8 | ✅ Done | ⬆ FS-12 |
| FS-21 | Governance §3.3 | Dual-control approval events — `POST /approvals/{incidentId}`, 2-actor requirement | 8 | ✅ Done | ⬆ FS-20 |
| FS-22 | Governance §10 | Executive dashboard — KPI scorecard (counts by status/severity, avg resolution time) | 5 | ✅ Done | ⬆ FS-12 |

### Sprint 7 Definition of Done
- [x] `IncidentStatus` extended: Draft, SubmittedLocal, PendingEvidence, Investigation, RcaReview, CapaExecution, Verification, Withdrawn, Reopened
- [x] `ApprovalType` enum: CloseInvestigation, RootCauseSignOff, CapaVerification, ResolutionFinal
- [x] `IncidentStateMachine` enforces all 16-state transitions (full adjacency map)
- [x] `ResolveIncidentCommand` severity routing: severity ≤ 2 → Investigation; severity > 2 → Resolved
- [x] `ApprovalEvent` entity + `ApprovalEventConfiguration` + migration `AddSprint7`
- [x] `SubmitApprovalCommand` — dual-control gate: 2 distinct actors required; SoD: actor cannot approve 2 consecutive gates; 403 on violation
- [x] `GovernanceController` — `POST /api/v1/approvals/{incidentId}`, `GET /api/v1/dashboard/executive`
- [x] `IDashboardRepository` + `DashboardRepository` — KPI aggregation (by severity, status, department, avg resolution, SLA breaches, CAPA rate)
- [x] `GovernanceOnly` auth policy: MANAGER, PLANT_MANAGER, SAFETY_OFFICER, COMPLIANCE_OFFICER, APPROVER
- [x] `executive-dashboard.component.ts` — 6 KPI cards + 3 bar-chart panels
- [x] Route `/governance/executive` + Governance sidebar section

---

## Sprint 8 — Audit Trail + Confidentiality ✅ COMPLETE

**Goal:** Every action is immutably logged; confidential/anonymous reporters are protected; identity unmask is audited.
**Total Points:** 13

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-23 | Governance §4.2 | Full `incident_state_log` — every action writes an append-only audit row | 5 | ✅ Done | ⬆ FS-21 |
| FS-24 | Epic 1 US-5 | Anonymous / confidential reporting — `reporting_mode`, identity masking, `ConfidentialityService` | 8 | ✅ Done | ⬆ FS-23 |

### Sprint 8 Definition of Done
- [x] `IncidentStateLog` entity + EF config + `AddSprint8` migration applied
- [x] `IIncidentStateLogger` injected into all command handlers: Approve, Reject, Claim, Escalate, Resolve, SubmitApproval
- [x] Every handler logs: DECISION / CLAIM / ESCALATION / STATE_CHANGE / APPROVAL events
- [x] `IIncidentStateLogRepository` + `IncidentStateLogRepository` — Clean Architecture compliant (fixes CA violation)
- [x] `GetIncidentTimelineQuery` — visibility_scope filtered (REPORTER → PUBLIC; COMPLIANCE_OFFICER → all; others → PUBLIC+INTERNAL)
- [x] `GET /api/v1/incidents/{id}/timeline` endpoint in GovernanceController
- [x] `POST /api/v1/incidents/{id}/unmask-reporter` — writes IdentityAccessAudit row, returns reporter email
- [x] `IConfidentialityService` + `ConfidentialityService` — single masking chokepoint
- [x] `CreateIncidentCommand.IsConfidential` — sets ReportingMode + ReporterVisibility on submission
- [x] `UnmaskReporterIdentityCommand` — authorized role unmask with audit trail
- [x] `GetApproverQueueQueryHandler` — applies `IConfidentialityService` masking per caller role
- [x] `IncidentSummaryDto` — `IsConfidential` + `ReporterDisplay` fields added
- [x] `ApproverController` — actor IDs extracted and passed to Approve/Reject/Claim/Escalate commands
- [x] `ResolverController` — actor ID passed to ResolveIncidentCommand
- [x] `timeline-panel.component.ts` — colour-coded audit timeline with event types, state transitions, visibility scope
- [x] `report-form.component.ts` — "Report Confidentially" toggle in Step 2 (Reporter Info)
- [x] `approver-queue.component.ts` — REPORTER column with "🔒 Confidential" badge
- [x] `governance.service.ts` — `getTimeline()` + `unmaskReporter()` methods
- [x] Program.cs — all new services registered: IIncidentStateLogger, IIncidentStateLogRepository, IIdentityAccessAuditRepository, IConfidentialityService

---

## Sprint 9 — Offline Sync + QR Entry ✅ COMPLETE

**Goal:** Factory floor workers can submit incidents without internet connectivity; QR codes on machines, lines, and safety posters pre-fill factory context; the server rejects duplicate syncs via idempotent payload hashing; Governance §8 monitoring blind-spot is closed.
**Total Points:** 21
**Depends on:** FS-01 (Done) for FS-25; FS-25 (Done) for FS-26
**Can run:** Parallel to Sprint 8 — no shared entity dependencies. FS-25 only requires `incidents` and `offline_drafts`; FS-26 only requires `qr_codes` and `incidents`.

> **Verified 2026-07-01:** `SyncOfflineDraftsBatchCommand`, `POST/GET /incidents/offline-sync(/status)`, `StaleDraftMonitorJob`, `QrController` (scan + admin CRUD under `/qr`, not `/admin/qr`), and the `offline-sync.service.ts` / `qr-scan.component.ts` frontend are all present in the codebase. Status moved from 🔲 Ready to ✅ Done.

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-25 | Epic 1 US-4 / Governance §8 | Offline sync — `offline_drafts` table, `SyncOfflineDraftCommand`, idempotent dedup via `payload_hash`, stale-draft monitoring job | 13 | ✅ Done | ⬆ FS-01 |
| FS-26 | Epic 1 US-6 / US-1 | QR entry — `qr_codes` table, QR scan endpoint, pre-fill context handshake, audit metadata stored on incident | 8 | ✅ Done | ⬆ FS-25 |

---

### FS-25: Offline Sync

**Epic source:** Epic 1 US-4, Governance Spec §8, architecture.md §4.7

#### Story

As a Reporter on the factory floor, I want to capture and submit an incident when there is no internet so that safety issues are never lost during network outages, and the system automatically syncs when connectivity returns — guaranteeing exactly one server incident per offline report.

#### Acceptance Criteria

1. Given there is no internet, when I submit an incident on the Angular app, then the report is saved to an `offline_drafts` local queue with `sync_status = Queued` and the UI shows a clear **"Not Synced"** badge; management has NOT received it yet.
2. Given connectivity returns, then the Angular app detects it (online/offline event) and automatically calls `POST /incidents/offline-sync` to replay all `Queued` drafts.
3. Given sync succeeds for a draft, then `sync_status` is updated to `Synced`, `server_incident_id` is populated, and the incident appears in the reporter's `GET /incidents/mine` list with `displayStatus = Submitted`.
4. Given the same draft is submitted twice (e.g., manual retry while sync is in-flight), then the server uses `payload_hash` deduplication — the second call returns the already-created incident ID and does NOT create a duplicate incident. HTTP 200 (not 201) on duplicate.
5. Given sync fails, then `sync_status = SyncFailed`, `sync_attempt_count` is incremented, and the UI shows a **"Sync Failed — Tap to Retry"** button.
6. Given a draft has `sync_status = Queued` and `local_event_time` is older than 24 hours, then the Hangfire `StaleDraftMonitorJob` writes a `SUBMITTED_LOCAL` state-log entry and fires a notification to the Plant Manager per Governance §8 (monitoring blind-spot alert).
7. Given `POST /incidents/offline-sync` is called with a batch of drafts, then each draft is processed atomically — one draft failure does NOT roll back other successful syncs in the same batch; the response includes per-draft success/failure detail.

#### Tasks

**Backend:**
- [ ] `OfflineDraft` entity + EF config (`offline_drafts` table per architecture.md §4.7):
  ```
  id UUID PK, local_draft_id VARCHAR UNIQUE, server_incident_id UUID FK NULL,
  reporter_id FK, payload_json JSONB, payload_hash VARCHAR(64),
  sync_status VARCHAR,   -- Queued, Syncing, Synced, SyncFailed
  sync_attempt_count INT DEFAULT 0,
  local_event_time TIMESTAMPTZ, server_received_at TIMESTAMPTZ NULL,
  sync_error_message TEXT NULL
  ```
- [ ] Migration `AddOfflineSync`: `offline_drafts` table + unique index on `(reporter_id, payload_hash)` for dedup
- [ ] `IOfflineDraftRepository` + `OfflineDraftRepository` (methods: `FindByHash`, `AddAsync`, `UpdateAsync`, `GetStaleDraftsAsync`)
- [ ] `SyncOfflineDraftCommand` — per-draft handler:
  - Accepts `localDraftId`, `payloadHash`, `incidentPayload` (same fields as `CreateIncidentCommand`)
  - Checks `offline_drafts` for existing row with matching `payload_hash + reporter_id` → if found, return existing `server_incident_id` (HTTP 200, idempotent)
  - If not found: call `CreateIncidentCommand` internally (reuse full validation pipeline); on success write `offline_drafts` row with `sync_status = Synced`
  - On failure: write `offline_drafts` row with `sync_status = SyncFailed`, `sync_error_message`
- [ ] `SyncOfflineDraftsBatchCommand` — wraps N individual `SyncOfflineDraftCommand` calls; returns `BatchSyncResult { synced: [], failed: [] }`
- [ ] `IncidentController` — `POST /api/v1/incidents/offline-sync` `[Authorize]` accepts array of draft payloads; calls `SyncOfflineDraftsBatchCommand`
- [ ] `StaleDraftMonitorJob` — Hangfire recurring (every 30 min):
  - Queries `offline_drafts` where `sync_status IN (Queued, SyncFailed)` AND `local_event_time < UtcNow - 24h`
  - For each stale draft: fires a `SUBMITTED_LOCAL` log entry (if `IncidentStateLogger` is available from FS-23) or writes a `notifications` row for Plant Manager (channel: InApp + Email)
  - Increments an `alert_sent_count` column to prevent repeated alerts (alert once, not on every job run)
  - Register in `Program.cs` alongside existing Hangfire jobs
- [ ] `OfflineSyncController` — `GET /api/v1/incidents/offline-sync/status` (returns counts: total drafts, queued, synced, failed for authenticated reporter) — used by the Angular sync status panel

**Frontend:**
- [ ] `offline-sync.service.ts` — manages the local draft queue:
  - `saveDraft(incident: CreateIncidentRequest): string` — serialises to `localStorage` under key `offline_draft_{uuid}`, computes SHA-256 `payload_hash` (via `SubtleCrypto`)
  - `getPendingDrafts(): OfflineDraft[]` — reads all `offline_draft_*` keys from `localStorage`
  - `syncAllDrafts()` — calls `POST /incidents/offline-sync` with all pending drafts; updates each draft's `sync_status` in localStorage on response
  - `clearSyncedDrafts()` — removes `Synced` entries from localStorage
- [ ] Offline detection in `report-form.component.ts`:
  - Listen for `window.online` / `window.offline` events
  - When offline: intercept `createIncident()` call → route to `offline-sync.service.saveDraft()` instead of HTTP POST → show "Not Synced" confirmation screen (same confirmation component as FS-01, with a warning banner)
  - When online: check `offline-sync.service.getPendingDrafts()`; if any exist, call `syncAllDrafts()` automatically
- [ ] Extend `report-form/confirmation.component.ts` (from FS-01) — add `@Input() syncStatus: 'synced' | 'queued' | 'failed'`:
  - `synced`: green "✓ Submitted" (existing)
  - `queued`: amber "⏳ Saved offline — Not yet received by management"
  - `failed`: red "✗ Sync Failed — Tap to retry" with retry button
- [ ] `sync-status-badge.component.ts` — small shared pill (green/amber/red) consumed by `my-incidents-list.component.ts` to indicate sync state per incident
- [ ] `app.component.ts` — on app init, call `offline-sync.service.syncAllDrafts()` if there are pending drafts and the device is online
- [ ] `offline-sync.service.ts` — listen to `navigator.onLine` changes and auto-trigger sync on reconnection

#### Dev Notes

**`payload_hash` computation:** SHA-256 of the serialised incident payload (category + short_description + severity + department + reporter_id + local_event_time). Do NOT include device-local timestamps that differ per retry — only include fields that represent the incident's content identity. Computed client-side via `SubtleCrypto.digest('SHA-256', ...)` (browser native, no library) and verified server-side via `System.Security.Cryptography.SHA256.HashData`.

**localStorage vs IndexedDB:** For the submission window, `localStorage` is sufficient (max ~5MB per origin; offline drafts are text-only before attachments sync). Architecture.md §10 notes that full offline resilience (evidence queuing, large payloads) needs IndexedDB + Service Worker. Document this boundary explicitly in the Angular service: `// TODO: Upgrade to IndexedDB + Service Worker for production offline-first resilience (see architecture.md §11)`.

**Attachment sync:** Offline attachments (photos taken offline) are a separate concern. For this story, attachment sync is stub-only: if the draft has pending attachments, note them in `pending_attachment_count` but do NOT sync files offline — they are uploaded after the incident is created online. The FS-25 `SyncOfflineDraftCommand` syncs text-only; attachment retry is a follow-up story.

**Governance §8 blind-spot:** The `SUBMITTED_LOCAL` canonical state (architecture.md §2.1) is the gap — management cannot act on an incident they don't know about. The `StaleDraftMonitorJob` closes this by surfacing stale offline drafts to the Plant Manager. This is a governance requirement, not optional.

---

### FS-26: QR Entry + Pre-fill Context

**Epic source:** Epic 1 US-6 / US-1 (QR access mode), Governance Spec §20

#### Story

As a Reporter scanning a machine, line, or safety-poster QR code, I want the reporting form to open with factory, section, line, and machine context already filled in, so that submissions from the factory floor are faster, more location-accurate, and fully audited for QR source metadata.

#### Acceptance Criteria

1. Given I scan a valid active QR code, when the Angular app receives the QR payload, then `GET /qr/{code}` returns the pre-fill context (factory, section, line, machine) and the report form opens with those fields populated.
2. Given I want to correct a prefilled field, then I can override it before submission, and the `manual_override_reason` is recorded on the incident.
3. Given the QR code is invalid, expired, or disabled, then `GET /qr/{code}` returns HTTP 404 with `{ "error": "QR code not found or inactive" }` and the UI shows a clear error with a "Report manually" fallback link.
4. Given an incident is submitted from a QR entry, then the incident row stores `source_channel = qr`, `qr_code_id`, and all prefilled context, so audit queries can filter incidents by QR source.
5. Given a QR code is scanned more than 50 times in 60 minutes (per Governance §20 anomaly detection), then an alert is logged in the `notifications` table for the Admin/Plant Manager — potential QR abuse or mass-incident.
6. Given a QR code is deactivated via the Admin panel (`PUT /admin/qr/{id}`), then subsequent scans immediately return 404 — no grace window.

#### Tasks

**Backend:**
- [ ] `QrCode` entity + EF config (`qr_codes` table):
  ```
  id UUID PK, code VARCHAR(64) UNIQUE,   -- short alphanumeric, not a full URL
  qr_type VARCHAR,                        -- machine, line, area, safety_poster, anonymous_public
  factory_id FK, section_id VARCHAR NULL, line_id VARCHAR NULL, machine_id VARCHAR NULL,
  label VARCHAR,                          -- human-readable label for Admin UI
  is_active BOOL DEFAULT true,
  created_by FK, created_at, deactivated_at NULL, deactivated_by FK NULL,
  scan_count INT DEFAULT 0, last_scanned_at TIMESTAMPTZ NULL
  ```
- [ ] Migration `AddQrCodes`: `qr_codes` table + `qr_code_id` FK column on `incidents` + `source_channel` column on `incidents` (if not already added in FS-01)
- [ ] `IQrCodeRepository` + `QrCodeRepository` (methods: `FindByCodeAsync`, `IncrementScanCountAsync`, `DeactivateAsync`)
- [ ] `GetQrContextQuery` + Handler:
  - Finds `QrCode` by `code`; returns 404 if not found or `is_active = false`
  - Increments `scan_count`, sets `last_scanned_at = UtcNow`
  - Checks scan rate: if `scan_count` in last 60 min > 50, fires anomaly alert (writes `notifications` row for Admin/PlantManager)
  - Returns `QrContextDto { qrCodeId, qrType, factoryId, sectionId, lineId, machineId, label }`
- [ ] Extend `CreateIncidentCommand` to accept `qrCodeId?` and `manualOverrideReason?` — store on `incidents.qr_code_id` and `incidents.manual_override_reason`
- [ ] `QrController` — `GET /api/v1/qr/{code}` (no auth required — anonymous scanning is the primary use case), returns `QrContextDto`
- [ ] Admin endpoints — `GET /api/v1/admin/qr`, `POST /api/v1/admin/qr`, `PUT /api/v1/admin/qr/{id}` (activate/deactivate, update label) — role guard: `AdminOnly`
- [ ] Register `IQrCodeRepository` in `Program.cs`
- [ ] Seed 3 test QR codes in `DataSeeder.cs` (dev only): one for Line 7, one for Sewing Machine M-0042, one for Safety Poster — so devs can test without printing physical QR codes

**Frontend:**
- [ ] `qr-scan.component.ts` — handles deep-link route `/report/qr/:code`:
  - On init: calls `qr.service.getContext(code)` → if success, navigates to `/report` with pre-filled state via Angular Router `state` (no URL params — avoids leaking machine IDs in browser history)
  - If 404: shows error card "This QR code is not active" with "Report manually" button → navigates to `/report` with empty form
- [ ] `qr.service.ts` — `getContext(code): Observable<QrContextDto>` — calls `GET /qr/{code}`
- [ ] Extend `report-form.component.ts`:
  - On init, read pre-fill state from `router.getCurrentNavigation()?.extras.state`
  - Populate category, department, section, line, machine inputs from pre-fill context
  - Show a `"Pre-filled from QR: [label]"` info chip above the form, with an "Edit" link to unlock fields
  - When a pre-filled field is manually changed, set `manualOverrideReason = 'Reporter corrected prefilled context'` automatically
- [ ] Route `/report/qr/:code` in `app.routes.ts` with `roleGuard` (QR route allows unauthenticated for anonymous QR types — handled by `qr.service` returning context without auth token)
- [ ] `QrCodeAdminComponent` — basic CRUD list in Administration panel (list of QR codes, activate/deactivate toggle, "Copy Link" button that generates `https://{host}/report/qr/{code}`) — integrates into the `Administration` component's left-nav under a new `qr-codes` section

#### Dev Notes

**QR code format:** The `code` field is a short alphanumeric string (e.g., `FS-L7-M042`), NOT a full URL. The QR itself encodes `https://{host}/report/qr/{code}`. This means changing the host (e.g., from dev to prod) does not invalidate existing printed QR codes as long as the code string is preserved.

**Anonymous QR scanning:** `GET /qr/{code}` requires no JWT. The route is public. After the form is pre-filled, if the user is NOT authenticated, the form uses `reporting_mode = anonymous_qr` (from FS-24). This is the intersection of US-1 (QR access mode) and US-5 (anonymous mode). FS-26 only wires the pre-fill; the `anonymous_qr` reporting mode enforcement is owned by FS-24.

**`source_channel` column:** Check whether `CreateIncidentCommand` in FS-01 already includes `source_channel`. If not, add it in this migration — it affects the `incidents` table and is a non-breaking addition.

**No QR scanning hardware dependency in tests:** The Angular QR route is triggered by URL navigation, not a camera scan. Any QR reader app (Google Lens, a QR scanner) that opens `https://{host}/report/qr/FS-L7-M042` will navigate to the correct Angular route. No `@zxing/ngx-scanner` or camera permission needed for this story.

---

### Sprint 9 Definition of Done

- [x] `POST /incidents/offline-sync` accepts a batch of draft payloads via `SyncOfflineDraftsBatchCommand`
- [x] `payload_hash + reporter_id` dedup implemented in `SyncOfflineDraftCommand`
- [x] Angular `offline-sync.service.ts` + `sync-status-badge.component.ts` handle localStorage queue and reconnect sync
- [x] `StaleDraftMonitorJob` (Hangfire) exists
- [x] `GET /qr/{code}` (anonymous scan) + `GET/POST/PUT /qr` (admin, guarded by `GovernanceOnly`) implemented — note: admin routes live under `/qr`, not `/admin/qr` as originally spec'd
- [x] `qr-scan.component.ts` pre-fills report form from QR context
- [x] `CreateIncidentCommand` accepts `qrCodeId` / `manualOverrideReason`, sets `source_channel`
- [ ] QR scan-rate anomaly alert (>50/60min) — not verified in this pass
- [ ] Dev QR code seeding — not verified in this pass
- [x] Migrations for offline sync + QR codes applied (present in `Infrastructure/Migrations`)
- [ ] Story files FS-25.md and FS-26.md — not created

---

### Sprint 9 Risk Notes

| Risk | Mitigation |
|---|---|
| `SubtleCrypto` SHA-256 is async — must not block form submission | Compute hash at draft save time (user taps Submit), not at sync time. Use `await crypto.subtle.digest(...)` wrapped in an async guard before `localStorage.setItem` |
| localStorage 5MB cap hit if reporter takes many photos while offline | Attachment sync is explicitly stub-only for this story (text payload only). Photo queuing requires IndexedDB + Service Worker — documented as a follow-up, not a Sprint 9 risk |
| `window.online` event is unreliable on some Android WebViews | Supplement with a passive `HEAD /api/v1/health` ping every 30s when the app has drafts pending. If 200 → trigger sync. This is already available from the FS-00 health endpoint |
| QR scan rate anomaly threshold (50/60min) may need calibration per factory size | The threshold is seeded as a configurable value in `sla_configuration` (not hardcoded) — Admin can change it via the Workflow Config section without a code deploy |
| `anonymous_qr` reporting mode depends on FS-24 (confidentiality) | FS-26 stores `source_channel = qr` correctly without FS-24. The `reporting_mode = anonymous_qr` enforcement is marked as a stub and guarded by a feature flag until FS-24 is Done |

---

## Epic 2 Final — Enumeration Reference (Single Source of Truth)

> Per Epic 2 Final Field Summary: every enum MUST be defined once and referenced by ID, not duplicated as inline strings.

| Enum | Values |
|---|---|
| `action_status` | OPEN, IN_PROGRESS, COMPLETED, CANCELLED, VERIFIED, OVERDUE |
| `resolution_status` | PENDING, RESOLVED, APPROVED, REJECTED |
| `investigation_status` | NOT_STARTED, IN_PROGRESS, ROOT_CAUSE_IDENTIFIED, BLOCKED |
| `SLA_status` | ON_TRACK, AT_RISK, BREACHED |
| `upload_status` | PENDING, UPLOADED, FAILED, VALIDATED |
| `escalation_source` | RESOLVER_INITIATED, SLA_AUTO, MANUAL_OVERRIDE |
| `escalation_resolution` | OPEN, ACKNOWLEDGED, SELF_RESOLVED, REASSIGNED |
| `root_cause_code` | EQUIPMENT_FAILURE, PROCEDURE_GAP, HUMAN_ERROR, DESIGN_DEFECT, EXTERNAL_FACTOR, UNKNOWN_UNDER_INVESTIGATION |
| `severity` | LOW (4), MEDIUM (3), HIGH (2), CRITICAL (1) |
| `incident_status` | OPEN, IN_PROGRESS, INVESTIGATION, PENDING_APPROVAL, CLOSED, REJECTED |
| `approval_type` | CLOSE_INVESTIGATION, CAPA_VERIFICATION, ROOT_CAUSE_SIGN_OFF, RESOLUTION_FINAL |
| `timeline_event_type` | STATUS_CHANGED, COMMENT_ADDED, ASSIGNED, INVESTIGATION_SAVED, ROOT_CAUSE_SET, ACTION_CREATED, ACTION_STATUS_CHANGED, EVIDENCE_UPLOADED, ESCALATED, RESOLVED, APPROVED, **REJECTED**, **SLA_BREACHED** |
| `notification_channel` | IN_APP, EMAIL, SMS, PUSH |
| `notification_trigger` | ASSIGNED, OVERDUE, SLA_EXCEEDED, STATUS_CHANGED, EVIDENCE_UPLOADED, RESOLVED, ESCALATED, APPROVED, REJECTED |
| `delivery_status` | PENDING, SENT, DELIVERED, FAILED, RETRYING |

> **Implementation note:** `incident_status` maps to the C# `IncidentStatus` enum already in the codebase. `severity` maps to int (1–4). `approval_type` maps to `ApprovalType` enum. All string enums in the DB should use `VARCHAR` with a constraint or C# `string` constants — not free text.

---

## Sprint 10 — Compliance Dashboard + Notification System + Approver Audit Trail ✅ COMPLETE

**Goal:** A Compliance Officer has a full cross-case pattern view with identity-access and dispute audit visibility; multi-channel notifications are wired end-to-end so every relevant actor receives in-app, email, and SMS alerts on breach, approval, and escalation events; every Approver decision is permanently logged in an immutable approval-chain audit trail.
**Total Points:** 34
**Depends on:** Sprint 8 (FS-24 Done), Sprint 5 (FS-14b Done), Sprint 6 (FS-16/FS-17 Done for audit chain data)
**Dates:** Scheduled after Sprint 9 (or can run in parallel with Sprint 9 since no shared dependencies)

> **Re-scoped from 21 → 34 pts.** Three additions from source docs:
> 1. FS-27 gains two compliance panels from Approver Workflow PRD (Dispute Summary, Loop Guard Tiebreak) and backend query work to support them.
> 2. FS-28 gains Approver-specific US-10 notification rules (digest batching, active-viewer suppression, escalation-exhausted fallback, correct `notification_type` enum).
> 3. New **FS-29** (8 pts) added for US-11 Approver Audit Trail — distinct from FS-23's incident_state_log; covers the approval-chain timeline with `approval_level_at_action`, `claim_history_log`, and `tiebreak_pending` events.

> **Verified 2026-07-01:** `GetComplianceDashboardQuery` returns all 7 panels (A–G, including dispute summary and loop guard tiebreak) via a single `GET /compliance/dashboard`. `INotificationDispatcher` + `DevEmailService`/`DevSmsService`/`NotificationReminderJob` are implemented and wired into `SlaCheckJob`/approval/escalation flows.
>
> **Updated 2026-07-01 (Sprint 10 close):** All 3 remaining sub-pieces completed. `GET /compliance/identity-access-audit` added with `from/to/actorId` filter params and SoD exclusion (actor != current user). `GET /compliance/export/{incidentId}` added — generates a watermarked PDF evidence package (incident header, approval chain, CAPA list, identity-access log) and writes an `IdentityAccessAudit` row for the export event itself. FS-29 Approver Audit Trail fully implemented: `GET /incidents/{id}/approval-audit-trail` returns `ApprovalAuditTrailDto` with `ApprovalChain` (gate, `approval_level_at_action`, actor, decision, timestamp), `ClaimHistory` (all claim/unclaim events), and `RoutingEvents` (all reroutes with `TriggeredLoopGuard` flag). Accessible to APPROVER, GOVERNANCE, COMPLIANCE_OFFICER, ADMIN. Build verified clean.

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-27 | Governance §10.3, Approver PRD US-5/6 | Compliance dashboard — 7-panel view incl. dispute summary + loop guard tiebreak panel | 13 | ✅ Done | ⬆ FS-24 |
| FS-28 | Epic 2 US-10 / Governance §13 | Notification system — in-app, email, SMS, digest batching, delivery audit, Approver-specific rules | 13 | ✅ Done | ⬆ FS-14b |
| FS-29 | Approver PRD US-11 | Approver audit trail — immutable approval-chain log, `approval_level_at_action`, claim history, tiebreak events | 8 | ✅ Done | ⬆ FS-16, ⬆ FS-17, ⬆ FS-23 |

---

### FS-27: Compliance Dashboard

**Epic source:** Governance Spec §10.3, §9.5, §2.4.3, §4.5, §6.4, §11

#### Story
As a Compliance Officer, I want a dedicated dashboard showing cross-case patterns, identity-access audit entries, investigation methodology distribution, overdue CAPA flags, and rejection dispute history, so that I can fulfil my regulatory audit obligations without navigating per-incident detail views.

#### Acceptance Criteria

1. Given I'm authenticated as COMPLIANCE_OFFICER, when I load `/compliance/dashboard`, then I see the 7 panels: (a) Incident Pipeline by Stage, (b) Investigation Methodology Distribution, (c) Overdue CAPA / Repeat-Failure CAPA, (d) Identity-Access Audit Log, (e) Rejection Dispute Summary, (f) Loop Guard & Tiebreak Pending, (g) Escalation Exhausted cases.
2. Given a CAPA has been rejected twice for the same case, then it appears in the "Repeat-Failure CAPA" list with a red flag and the case is blocked from closure until a fresh RCA is obtained (state machine guard already in FS-20).
3. Given any user viewed a confidential reporter's identity, then that event appears in the Identity-Access Audit panel with actor name, timestamp, and purpose code.
4. Given an investigation used methodology `OTHER`, then the compliance dashboard Investigation Methodology panel shows the `OTHER` count with a drill-down list of cases requiring weekly review per Governance §2.4.3.
5. Given I filter the dashboard by date range (`?from=&to=`), then all 7 panels respect the filter.
6. Given I click "Export Audit Package" on any incident from the dashboard, then a PDF + evidence zip is generated with the watermark defined in Governance §3.4.
7. **[NEW — Approver PRD US-5]** Given a Soft-Rejected incident has a dispute filed against it, then Panel E (Rejection Dispute Summary) shows it with `dispute_status`, `dispute_window_until`, and whether the dispute reopened the case — allowing Compliance Officer to spot patterns of contested rejections.
8. **[NEW — Approver PRD US-6]** Given an incident has `loop_guard_triggered = true` or `tiebreak_pending = true`, then Panel F (Loop Guard & Tiebreak Pending) surfaces it with the reroute count, originating and destination levels, and current tiebreak owner — so Compliance Officer can unblock stalled incidents.
9. **[NEW — Approver PRD US-7]** Given an incident has `escalation_exhausted = true`, then Panel G surfaces it with the `fallback_notified_role` and elapsed time since exhaustion — so nothing falls through silently.

#### Tasks

**Backend:**
- [ ] `ComplianceDashboardQuery` + Handler — aggregates: incident counts by canonical state, methodology distribution, CAPA failure flags, identity-access audit entries (last 30d), rejection disputes grouped by reason
- [ ] `GetIdentityAccessAuditQuery` — returns `identity_access_audit` rows visible to COMPLIANCE_OFFICER only; query params: `?from=&to=&actorId=`
- [ ] `GetRepeatFailureCapasQuery` — returns cases where `capa_rejection_count >= 2`; surface `RepeatFailureCapa` flag
- [ ] `GetInvestigationMethodologyDistributionQuery` — groups `investigation_methodology_used` across all cases in period; flags OTHER count
- [ ] `GetRejectionDisputeSummaryQuery` — counts REJECTED incidents with `reject_type = Soft` and whether a dispute was filed; groups by reason category; includes `dispute_status`, `dispute_window_until`, `reopened_from_rejection` per Approver PRD US-5
- [ ] **[NEW]** `GetLoopGuardTiebreakQuery` — returns incidents where `loop_guard_triggered = true` OR `tiebreak_pending = true`; fields: `reroute_count`, `from_level`, `to_level`, `tiebreak_owner`, `days_stalled`; sourced from `incident_routing_log` (FS-17)
- [ ] **[NEW]** `GetEscalationExhaustedQuery` — returns incidents where `escalation_exhausted = true`; fields: `incident_ref`, `fallback_notified_role`, `escalation_exhausted_at`, `hours_elapsed`; sourced from `escalations` table (FS-15)
- [ ] `ComplianceController` — `GET /api/v1/compliance/dashboard` (query params: `?from=&to=`), role guard `ComplianceOfficerOnly`
- [ ] `ComplianceController` — `GET /api/v1/compliance/identity-access-audit`
- [ ] `ComplianceController` — `GET /api/v1/compliance/export/{incidentId}` — generates evidence package (PDF + zip); writes an `identity_access_audit` row for the export event itself
- [ ] `ComplianceOfficerOnly` auth policy — COMPLIANCE_OFFICER role; add to `AuthorizationPolicies.cs`
- [ ] `vw_investigation_methodology_30d` materialized view — defined in migration `AddSprint10`; refreshed by a Hangfire daily job
- [ ] DB migration `AddSprint10`: `capa_rejection_count INT DEFAULT 0` on `corrective_actions`; `export_audit_log` table; `escalation_exhausted BOOL DEFAULT false` + `fallback_notified_role VARCHAR` on `escalations` table (if not already added by FS-15)

**Frontend:**
- [ ] `compliance-dashboard.component.ts` — 7-panel layout
- [ ] Panel A: "Incident Pipeline" — horizontal stacked bar by canonical state
- [ ] Panel B: "Investigation Methodology" — donut chart; OTHER segment clickable → drill-down
- [ ] Panel C: "Overdue / Repeat-Failure CAPAs" — sortable table: incident ref, CAPA title, rejection count, days overdue, red flag
- [ ] Panel D: "Identity Access Audit" — chronological log; filterable by date range
- [ ] Panel E: "Rejection Dispute Summary" — bar chart by reason; dispute filed vs. not; `dispute_status` chips
- [ ] **[NEW]** Panel F: "Loop Guard & Tiebreak Pending" — list of stalled incidents with reroute count badge, level-from → level-to arrow, days stalled, "Resolve Tiebreak" action button (links to Admin)
- [ ] **[NEW]** Panel G: "Escalation Exhausted" — list of incidents with `escalation_exhausted = true`; hours elapsed badge in red; `fallback_notified_role` shown
- [ ] Date-range filter (shared across all panels)
- [ ] "Export Audit Package" button on Panel C and D rows
- [ ] Route `/compliance/dashboard`, guarded by `roleGuard` with COMPLIANCE_OFFICER/ADMIN
- [ ] Add "Compliance" sidebar section to `app.component.ts` with link to `/compliance/dashboard` (visible to COMPLIANCE_OFFICER and ADMIN only)
- [ ] `compliance.service.ts` — `getDashboard(from, to)`, `getIdentityAudit(from, to)`, `exportAuditPackage(incidentId)`

#### Dev Notes

**Governance §10.3 fixed KPI set (max 7 visual elements):** The spec says "no more than 7 visual elements on the executive screen." The compliance dashboard is a separate screen (§10.3 vs §10.1) and is allowed more panels — it is a working tool, not a headline view. Still keep each panel self-contained and collapsible.

**Export watermark:** The PDF generation for `GET /compliance/export/{incidentId}` uses a server-side HTML-to-PDF approach (e.g., `PuppeteerSharp` or `QuestPDF`). The watermark text is: `"CONFIDENTIAL — iFar-Silexa (Pvt.) Ltd. — Case [ID] — Exported by [Name] on [Date]"` per Governance §3.4. Add a `IReportExportService` abstraction so the PDF engine can be swapped.

**CAPA rejection count:** The `capa_rejection_count` counter on `corrective_actions` is incremented by `SubmitApprovalCommand` (FS-21) when `approvalType = CAPA_VERIFICATION` and `action = REJECT`. No new command needed — extend the existing handler.

**SoD linkage:** The compliance dashboard identity-access audit (Panel D) must exclude entries made by the currently authenticated Compliance Officer viewing the panel — to avoid the self-referential audit loop. Filter `actor_id != currentUser.id` in `GetIdentityAccessAuditQuery`.

---

### FS-28: Notification System

**Epic source:** Governance Spec §13, Epic 2 US-10

#### Story
As any system user, I want to receive timely notifications (in-app badge, email, and SMS) when incidents are assigned to me, SLA thresholds are breached, approvals are required, or escalations fire, so that I never miss a time-sensitive action without checking the UI.

#### Acceptance Criteria

1. Given an SLA BREACH event fires (Hangfire `SlaCheckJob`), then within 1 minute the responsible actor receives an in-app notification AND an email. No duplicate within the same clock period (idempotency key: `incident_id + event_type + clock_period`).
2. Given a new incident is assigned to a Resolver, then the Resolver receives an in-app notification and email within 60 seconds.
3. Given an approval is required (dual-control gate fires), then all eligible approvers for that `approval_type` receive an in-app notification with `notification_type = immediate`.
4. Given a notification has been sitting unread for more than the configured `reminder_interval_minutes` (default 60), then a single reminder is sent — no further reminders until the notification is read or acted on.
5. Given I open the `/notifications` page, then I see all my notifications with unread count, type icon, and "Mark as Read" / "Mark All Read" actions backed by real API calls.
6. Given the delivery channel for a user is `Email`, then the email body contains incident reference, event description, a direct deep-link URL, and the watermark footer per §3.4.
7. Given an in-app notification is clicked, then it navigates directly to the relevant incident/approval screen and marks itself read.
8. **[NEW — Approver PRD US-10 AC2]** Given a High-severity incident enters the Approver queue, then the Approver receives an `immediate` notification. Given multiple Low/Medium incidents enter the queue within `batch_window_minutes` (default 5), then they are batched into a single digest notification (`notification_type = digest`) — not one per incident.
9. **[NEW — Approver PRD US-10 AC4]** Given an Approver has already claimed and is actively viewing an incident (tracked via `is_actively_viewing` session flag), then SLA warning and assignment notifications for that incident are suppressed to prevent duplicates.
10. **[NEW — Approver PRD US-7]** Given an incident has `escalation_exhausted = true` (no further configured level), then the system fires a `notification_type = escalation` to the `fallback_notified_role` (default: Admin) with message "Escalation exhausted — no further level configured."

#### Tasks

**Backend:**
- [ ] `Notification` entity already has table from FS-14b migration — verify columns cover: `id`, `recipient_user_id`, `channel` (InApp/Email/SMS), `trigger_event`, `incident_id FK`, `title`, `message`, `deep_link_path`, `is_read`, `sent_at`, `read_at`, `delivery_status`, `idempotency_key`, `batched`, `batch_window_minutes`; add missing columns via migration `AddSprint10NotificationColumns` if needed
- [ ] `INotificationDispatcher` interface — `DispatchAsync(NotificationRequest)` — accepts channel list, idempotency key, recipient, message; implemented by `NotificationDispatcher`
- [ ] `InAppNotificationChannel` — writes a `Notification` row with `channel = InApp`; signals via SignalR hub (or polling — see Dev Notes)
- [ ] `EmailNotificationChannel` — sends via `IEmailService` abstraction (SMTP for dev, SendGrid-compatible for prod); renders `EmailTemplate` with incident ref, description, deep link, watermark footer
- [ ] `SmsNotificationChannel` — sends via `ISmsService` abstraction (stub for dev, Twilio-compatible interface for prod); SMS body ≤ 160 chars
- [ ] `NotificationDispatcher` — routes to correct channel(s) per `recipient.preferred_channel`; checks idempotency key before dispatch; applies batch-window dedup (§13)
- [ ] Inject `INotificationDispatcher` into: `SlaCheckJob` (breach + warning events), `ApproveIncidentCommand` (on approve → notify Resolver), `EscalateIncidentCommand` (on escalation → notify next level), `SubmitApprovalCommand` (on gate fire → notify eligible approvers)
- [ ] `NotificationReminderJob` — Hangfire recurring (every 15 min): finds unread `InApp` notifications older than `reminder_interval_minutes`; dispatches one reminder (checks `reminder_sent = false`); sets `reminder_sent = true`
- [ ] `NotificationsController` — `GET /notifications` (paged, `?unreadOnly=&page=&pageSize=`, newest first), `POST /notifications/{id}/read`, `POST /notifications/read-all`, `GET /notifications/count`
- [ ] `GetNotificationsQuery` + Handler — returns notifications for authenticated user; applies `unreadOnly` filter; paginates
- [ ] `MarkNotificationReadCommand` + Handler
- [ ] `MarkAllNotificationsReadCommand` + Handler
- [ ] Register `INotificationDispatcher`, `IEmailService`, `ISmsService`, channel implementations in `Program.cs`
- [ ] Dev stubs: `DevEmailService` (logs to console), `DevSmsService` (logs to console) — only wired when `ASPNETCORE_ENVIRONMENT = Development`

**Frontend:**
- [ ] Replace mock data in `notifications.component.ts` with real API calls via `notification.service.ts`
- [ ] `notification.service.ts` — `getNotifications(unreadOnly, page)`, `markRead(id)`, `markAllRead()`, `getUnreadCount()`
- [ ] Unread count polling — `NotificationBadgeService` polls `GET /notifications/count` every 60 seconds; updates the `navbar-badge` in `app.component.ts` navbar with live count
- [ ] On notification row click: navigate to `deepLinkPath` and call `markRead(id)` simultaneously
- [ ] "Mark All Read" button in notifications page header — calls `POST /notifications/read-all`, refreshes list
- [ ] `app.component.ts` — wire `navbarBadge` signal to `NotificationBadgeService.unreadCount` (replace hardcoded `8`)

#### Dev Notes

**SignalR vs polling:** Full SignalR hub adds a WebSocket infrastructure dependency. For MVP Sprint 10, use 60-second client polling (`GET /notifications/count`) for the badge, and 30-second polling for the notifications page while it's open. Document in architecture.md §11 that SignalR is the production path. Polling is acceptable for the submission window.

**Channel dispatch order:** Always dispatch InApp first (synchronous, zero external dependency), then Email (async via `IHostedService` background queue), then SMS (async, last). If InApp succeeds but Email fails, do not re-dispatch InApp. The idempotency key prevents double-delivery across retries.

**Batch window:** Governance §13 specifies a `batch_window_minutes` to prevent notification flooding (e.g., 50 L1 incidents in a mass event). Default: `batch_window_minutes = 5` for Email/SMS; 0 (immediate) for InApp. A batched notification consolidates N events into one "You have N new incidents requiring action" email. The `batched` and `batch_window_minutes` columns are already on the `notifications` table design.

**Deep link format:** `deepLinkPath` is a relative Angular route, e.g. `/approver/incidents/INC-2024-0892` or `/resolver/incidents/INC-2024-0892/investigation`. The email template prepends `https://{host}` to make it absolute. Never store absolute URLs in the DB — they break when the host changes.

**SoD — Compliance Officer self-notification:** A Compliance Officer who triggers an approval event must not be listed as an eligible notified approver for the same event on the same case (mirrors the SoD rule in FS-21). The `NotificationDispatcher` skips `actor_id` when building the recipient list.

---

### Sprint 10 Definition of Done

- [x] `GET /compliance/dashboard` returns all 7 panel datasets (A–G), filtered by date range — performance under load not benchmarked
- [x] Repeat-Failure CAPA flag (Panel C) present in `ComplianceDashboardDto`
- [x] Identity-access audit panel (Panel D) present in the combined dashboard response, plus a dedicated `GET /compliance/identity-access-audit` endpoint (SoD-filtered)
- [x] `GET /compliance/export/{incidentId}` — watermarked PDF (approval chain + CAPA + identity audit) — confirmed live 2026-07-02
- [x] In-app notification dispatch wired into `SlaCheckJob` / approval / escalation flows via `INotificationDispatcher`
- [x] Email notification via `DevEmailService` (dev stub, logs to console)
- [x] SMS stub (`DevSmsService`) logs to console in Development
- [x] `NotificationReminderJob` exists (Hangfire recurring)
- [ ] Digest batching / active-viewer suppression / idempotency-key dedup — **not verified**, needs a focused test pass
- [x] Navbar badge polls `GET /notifications/count`
- [x] `/notifications` page (`notifications.component.ts`) backed by real API calls (get/count/read/read-all)
- [ ] 401/403 authorization matrix for all new endpoints — not explicitly tested
- [x] `ComplianceOfficerOnly` policy exists and guards `ComplianceController`
- [x] Migration `AddAdminAnalyticsRcaModules` (+ related) applied
- [ ] Story files FS-27.md and FS-28.md — not created

---

### Sprint 10 Risk Notes

| Risk | Mitigation |
|---|---|
| PDF export engine choice (PuppeteerSharp requires Chromium) | Use `QuestPDF` (pure .NET, no browser dep) for the submission window; wrap in `IReportExportService` so it can be swapped to PuppeteerSharp for richer fidelity post-submission |
| SignalR adds infra complexity | Deferred to post-submission; polling is explicitly documented as the MVP path |
| Email / SMS external services not available in dev | `DevEmailService` and `DevSmsService` stubs log to `ILogger`; zero external calls in Development environment |
| Compliance dashboard query performance on 6-month window | `vw_investigation_methodology_30d` materialized view + `IDashboardRepository` bulk aggregate query; add `EXPLAIN ANALYZE` test for 10k-row dataset before marking Done |

---

---

## Sprint 11 — Epic 2 Spec Gap Closure ✅ COMPLETE

**Goal:** Close the delta between the Epic 2 Final spec (reviewed 2026-07-01) and the current implementation — specifically the Escalation lifecycle (missing acknowledgement + secondary escalation) and the Investigation status tracking (missing status field and completion timestamp).
**Total Points:** 21
**Depends on:** FS-15 (Done), FS-07/FS-08 (Done)

> **Why these were missed:** FS-15 (Sprint 5) captured the escalation entity creation and SLA auto-escalation trigger but did not implement the Manager acknowledgement flow or the secondary L2 fan-out to Safety Officer. FS-07 (Sprint 3) built the Investigation entity with notes and findings fields but omitted `investigation_status` and `investigation_completed_at`, which became required by Epic 2 Final US-2 (root cause must be `ROOT_CAUSE_IDENTIFIED` before resolve can proceed). These gaps were surfaced by the Epic 2 Final spec review on 2026-07-01.

> **Verified 2026-07-01:** Both gaps are closed. `Escalation` entity has `EscalatedToId`/`AcknowledgedAt`/`Resolution`; `ApproverController.AcknowledgeEscalation` and `SlaCheckJob`'s 48h secondary L2 auto-escalation (fan-out to `SAFETY_OFFICER`) are both present; `SelfResolveEscalationCommand` is wired into `UpdateCorrectiveActionCommandHandler`. `Investigation` entity has `InvestigationStatus`/`InvestigationCompletedAt`; `SaveInvestigationCommandHandler` auto-transitions to `ROOT_CAUSE_IDENTIFIED` when `root_cause_code` is saved; `ResolveIncidentCommand` blocks resolution unless `InvestigationStatus == "ROOT_CAUSE_IDENTIFIED"`; `POST /incidents/{id}/investigation/block` exists.

| # | Story | Title | Points | Status | Depends on |
|---|---|---|---|---|---|
| FS-30 | Epic 2 US-8 | Escalation lifecycle — `escalated_to`, Manager acknowledgement, secondary L2 auto-escalation, `resolution` enum | 13 | ✅ Done | ⬆ FS-15 |
| FS-31 | Epic 2 US-2 | Investigation status tracking — `investigation_status` enum, `investigation_completed_at`, validation gate | 8 | ✅ Done | ⬆ FS-08 |

---

### FS-30: Escalation Lifecycle (Epic 2 US-8 Completion)

**Epic source:** Epic 2 Final US-8, US-5 (escalation_reason field)

#### Gap Summary (what FS-15 missed)
The `Escalation` entity built in FS-15 has `EscalationType` (= escalation_source), `Reason`, `EscalatedById`, and `EscalatedAt`. Missing per Epic 2 Final US-8:
- `escalated_to` (UUID FK → users.user_id; Manager by default for SLA_AUTO)
- `acknowledged_at` (nullable timestamp; set when Manager acknowledges)
- `resolution` (enum: OPEN → ACKNOWLEDGED / SELF_RESOLVED / REASSIGNED)
- Manager acknowledgement endpoint
- Secondary L2 auto-escalation after 48h (fan-out to Safety Officer)

#### Acceptance Criteria

1. Given SLA_AUTO escalation fires, then `escalated_to` is set to the Manager's user ID and `resolution = OPEN`.
2. Given the Manager acknowledges the escalation within 24 hours, then `acknowledged_at = UtcNow`, `resolution = ACKNOWLEDGED`, and no further auto-escalation occurs.
3. Given neither Resolver nor Manager responds within 48 hours of `SLA_status = BREACHED`, then a secondary escalation fires with `escalation_level = 2` and notification fan-out includes the Safety Officer role.
4. Given a Resolver responds after SLA escalation (updates action progress), then `resolution = SELF_RESOLVED` and a timeline entry is recorded.

#### Tasks

**Backend — Domain:**
- [ ] Add to `Escalation` entity: `EscalatedToId (Guid? FK → Users)`, `AcknowledgedAt (DateTime?)`, `Resolution (string DEFAULT "OPEN")`
- [ ] Migration `AddEscalationLifecycle`: new columns on `escalations` table + FK constraint on `escalated_to_id`
- [ ] Update `EscalationConfiguration.cs` — add `HasOne(e => e.EscalatedTo).WithMany().HasForeignKey(e => e.EscalatedToId).IsRequired(false).OnDelete(DeleteBehavior.SetNull)`

**Backend — Application:**
- [ ] `AcknowledgeEscalationCommand(EscalationId, ManagerId)` + Handler — validates actor has MANAGER or PLANT_MANAGER role; sets `AcknowledgedAt = UtcNow`, `Resolution = "ACKNOWLEDGED"`; writes timeline event `ESCALATED` with "Escalation acknowledged by [Manager]"
- [ ] `SelfResolveEscalationCommand(IncidentId, ResolverId)` — called by `UpdateCorrectiveActionCommand` when a Resolver updates progress after SLA breach; sets `Resolution = "SELF_RESOLVED"` on the open escalation for this incident
- [ ] Extend `SlaCheckJob` — secondary L2 trigger: if any escalation row has `Resolution = "OPEN"` AND `EscalatedAt < UtcNow - 48h`, then: create a new `Escalation` row with `Level = 2`, `EscalationType = "SLA_AUTO"`, dispatch `INotificationDispatcher` with `RecipientRole = "SAFETY_OFFICER"`, `TriggerEvent = "SLA_EXCEEDED"`, `IdempotencyKey = $"sla-L2:{incidentId}"`
- [ ] Update `EscalateIncidentCommand` (FS-15 handler) — set `EscalatedToId` to the resolved Manager's user ID when `EscalationType = SLA_AUTO`; use `IUserRepository.GetByRoleAsync("MANAGER")` to get the target

**Backend — API:**
- [ ] `ApproverController` — `POST /api/v1/incidents/{id}/escalation/{escalationId}/acknowledge` (role: MANAGER or PLANT_MANAGER); calls `AcknowledgeEscalationCommand`
- [ ] `ResolverController` — extend `PATCH /api/v1/actions/{id}` to auto-call `SelfResolveEscalationCommand` when `completion_percentage` is updated and an open escalation exists

**Frontend:**
- [ ] `escalation-panel.component.ts` — show `resolution` badge (OPEN/ACKNOWLEDGED/SELF_RESOLVED/REASSIGNED), `acknowledged_at`, `escalated_to` name
- [ ] Manager view: "Acknowledge Escalation" button (visible only when `resolution = OPEN` and user has MANAGER role) → calls acknowledge endpoint

#### Dev Notes

**`escalated_to` vs `escalated_by`:** `EscalatedById` is who triggered the escalation (nullable for SLA_AUTO — no human actor). `EscalatedToId` is the recipient (the Manager who must respond). These are distinct. For SLA_AUTO, `EscalatedById = null`, `EscalatedToId = Manager.Id`.

**Secondary escalation idempotency:** The L2 trigger checks `escalation_level = 1, resolution = OPEN, EscalatedAt < UtcNow - 48h` per incident. The `IdempotencyKey` on the notification prevents duplicate L2 alerts if `SlaCheckJob` runs multiple times before the L2 Escalation row is committed.

---

### FS-31: Investigation Status Tracking (Epic 2 US-2 Completion)

**Epic source:** Epic 2 Final US-2, US-5 (root cause gate before resolve)

#### Gap Summary (what FS-07/FS-08 missed)
The `Investigation` entity is missing:
- `InvestigationStatus (string)` — enum: NOT_STARTED, IN_PROGRESS, ROOT_CAUSE_IDENTIFIED, BLOCKED
- `InvestigationCompletedAt (DateTime?)` — set when status transitions to ROOT_CAUSE_IDENTIFIED

#### Acceptance Criteria

1. Given investigation is opened (`OpenInvestigationCommand`), then `investigation_status = IN_PROGRESS`.
2. Given `root_cause_code` is saved on the investigation, then `investigation_status` automatically transitions to `ROOT_CAUSE_IDENTIFIED` and `investigation_completed_at = UtcNow`.
3. Given `investigation_status != ROOT_CAUSE_IDENTIFIED`, then `ResolveIncidentCommand` throws `InvalidOperationException("Root cause must be identified before resolving")` — the system blocks resolution per US-2 AC3.
4. Given the investigation is blocked (e.g., waiting for external evidence), then the Resolver can manually set `investigation_status = BLOCKED`, which is surfaced on the Approver queue with a "Blocked" badge.

#### Tasks

**Backend — Domain:**
- [ ] Add to `Investigation` entity: `InvestigationStatus (string DEFAULT "IN_PROGRESS")`, `InvestigationCompletedAt (DateTime?)`
- [ ] Migration `AddInvestigationStatus`: `investigation_status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS'`, `investigation_completed_at TIMESTAMPTZ NULL`
- [ ] Update `InvestigationConfiguration.cs` — `HasMaxLength(50)` on `InvestigationStatus`

**Backend — Application:**
- [ ] Update `OpenInvestigationCommand` Handler — set `InvestigationStatus = "IN_PROGRESS"` on creation
- [ ] Update `SaveInvestigationCommand` Handler — when `RootCauseCode` is non-null: also set `InvestigationStatus = "ROOT_CAUSE_IDENTIFIED"`, `InvestigationCompletedAt = UtcNow`; write timeline event `ROOT_CAUSE_SET`
- [ ] Update `ResolveIncidentCommand` Handler — add pre-check: `if investigation.InvestigationStatus != "ROOT_CAUSE_IDENTIFIED" throw InvalidOperationException(...)` (US-2 AC3, US-5 AC gate)
- [ ] `SetInvestigationBlockedCommand(IncidentId, ResolverId, BlockReason)` + Handler — sets `InvestigationStatus = "BLOCKED"`; writes timeline event

**Backend — API:**
- [ ] `InvestigationController` — `POST /incidents/{id}/investigation/block { blockReason }` → `SetInvestigationBlockedCommand`
- [ ] Update `InvestigationWorkspaceDto` — add `investigationStatus`, `investigationCompletedAt` fields

**Frontend:**
- [ ] `investigation-workspace.component.ts` — show `investigationStatus` chip (colour-coded: IN_PROGRESS=blue, ROOT_CAUSE_IDENTIFIED=green, BLOCKED=red)
- [ ] "Mark as Blocked" button (with reason textarea) → calls `/investigation/block`
- [ ] "Mark Resolved" button remains disabled if `investigationStatus !== 'ROOT_CAUSE_IDENTIFIED'` (client-side guard, mirroring server validation per US-2 AC3)

#### Dev Notes

**Status auto-transition:** When `rootCauseCode` is saved via `SaveInvestigationCommand`, the status transitions automatically — no separate endpoint. This mirrors the existing pattern where `ResolveIncidentCommand` transitions incident status via `IIncidentStateMachine`.

**`InvestigationStatus` vs `IncidentStatus`:** These are two orthogonal state machines. `IncidentStatus` tracks the full 16-state pipeline. `InvestigationStatus` is scoped to the investigation entity only and has 4 values. Do not conflate them.

---

### Sprint 11 Definition of Done

- [x] `Escalation` entity has `EscalatedToId`, `AcknowledgedAt`, `Resolution` columns — migration `AddEscalationLifecycle` applied
- [x] `POST /incidents/{id}/escalation/{escalationId}/acknowledge` — sets `Resolution = ACKNOWLEDGED`; role-guarded
- [x] Secondary L2 escalation fires via `SlaCheckJob` after 48h without acknowledgement; Safety Officer notification dispatched
- [x] `Investigation` entity has `InvestigationStatus` and `InvestigationCompletedAt`
- [x] Saving `root_cause_code` automatically transitions `InvestigationStatus → ROOT_CAUSE_IDENTIFIED`
- [x] `ResolveIncidentCommand` blocks with `InvalidOperationException` if `InvestigationStatus != ROOT_CAUSE_IDENTIFIED`
- [x] Migration `AddEscalationLifecycle` + admin/analytics/RCA modules applied (see `AddAdminAnalyticsRcaModules`)
- [ ] Story files FS-30.md / FS-31.md not created — no separate story files found in `docs/stories/`

---

## Full Story Map (Ordered by Dependency)

```
Sprint 0 ──┬── FS-00 Project Skeleton
           └── FS-00b Auth (JWT, seed users)

Sprint 1 ──┬── FS-01 Create Incident
           ├── FS-02 Upload Attachment
           ├── FS-03 My Incidents list
           └── FS-03b Frontend Styling

Sprint 2 ──┬── FS-04 Approver Queue          
           └── FS-05 Approve / Reject         

Sprint 3 ──┬── FS-06 Resolver Assigned list
           ├── FS-07 Open Investigation        ← NEW domain (Investigation entities)
           ├── FS-08 Save Investigation Details
           ├── FS-09 Checklist toggle
           └── FS-10 Evidence panel

Sprint 4 ──┬── FS-11 CAPA: Create & track corrective actions
           ├── FS-12 Resolver: Resolve incident
           └── FS-13 AI Assistant stub (frontend only)

Sprint 5 ──┬── FS-14 SLA Engine (Hangfire jobs, sla_clocks)
           └── FS-15 Escalation (manual + auto)

Sprint 6 ──┬── FS-16 Claim / lock mechanism
           ├── FS-17 Reassign + loop guard
           ├── FS-18 Merge duplicate
           └── FS-19 Request more info (SLA pause)

Sprint 7 ──┬── FS-20 Full 16-state machine
           ├── FS-21 Dual-control approval events
           └── FS-22 Executive dashboard

Sprint 8 ──┬── FS-23 Full incident_state_log (audit trail)
           └── FS-24 Anonymous / confidential reporting

Sprint 9 ──┬── FS-25 Offline sync (offline_drafts, payload_hash dedup, StaleDraftMonitorJob, Governance §8)
           └── FS-26 QR entry (qr_codes table, pre-fill handshake, anomaly alert, Admin CRUD)

Sprint 10 ─┬── FS-27 Compliance dashboard (cross-reporter patterns, identity-access audit, CAPA repeat-failure)
           └── FS-28 Notification system (in-app, email, SMS, digest batching, live badge)

Sprint 11 ─┬── FS-30 Escalation lifecycle (escalated_to, acknowledgement, secondary L2 auto-escalation)   ← Epic 2 US-8 gap
           └── FS-31 Investigation status tracking (investigation_status enum, completed_at, resolve gate) ← Epic 2 US-2 gap
```

---

## Current Priorities (Next 3 Stories)

> **Re-verified 2026-07-02 against running code.** Backend is now effectively 100% complete — the 3 Analytics endpoints, FS-27 export/identity-audit sub-endpoints, and FS-29 Approver Audit Trail (previously listed here as gaps) are all confirmed live. Remaining work has shifted entirely to **frontend wiring** and production hardening; see `PROJECT_STATUS.md` → "Remaining / Partial" for the authoritative list.

| Priority | Item | Notes |
|---|---|---|
| 🔴 P1 | **Frontend: Analytics, Notifications, Admin, Escalation components** | Backend APIs done; these components still render mock data instead of calling the real endpoints |
| 🟠 P2 | **Frontend: Compliance dashboard + Approval audit trail panel** | No component/route exists yet for either, despite both backends being complete |
| 🟡 P3 | **Production hardening** | Real Email/SMS providers (replace dev stubs), SignalR push (replace 60s polling), Hangfire dashboard auth in prod, digest-batching verification, frontend E2E automation in CI |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Investigation Workspace scope creep (Figma has many sub-panels) | High | High | Split into FS-07 (open) → FS-08 (save) → FS-09 (checklist) → FS-10 (evidence) — never build multiple panels in one story |
| SLA engine complexity (Hangfire setup + clock management) | Medium | High | FS-14 is the largest story (13 pts); pair it with FS-15 only if FS-14 is clean; otherwise make FS-15 its own sprint |
| Dual-control approval (FS-21) SoD edge cases | Medium | High | Write explicit ACs for same-actor-twice scenario before implementation; validate at DB level not just app layer |
| State machine scope (16 states) vs MVP (7 states) | Low | Low | `IIncidentStateMachine` abstraction means the interface doesn't change — only the allowed transitions list grows. No refactor needed |
| Offline sync (FS-25) requires PWA / Service Worker | High | Medium | Deferred correctly — do not pull into current sprints |
| Email/SMS external services unavailable in dev (FS-28) | Low | Low | `DevEmailService` + `DevSmsService` stubs log to `ILogger` in Development; zero external calls — risk is contained |
| PDF export engine dependency (FS-27) | Medium | Low | Use `QuestPDF` (pure .NET, no Chromium); wrap in `IReportExportService` abstraction for post-submission swap |
| SignalR infra adds WebSocket complexity (FS-28) | High | Medium | Use 60s polling for MVP Sprint 10; document SignalR as the production upgrade path in architecture.md §11 |

---

## Story File Template (for new stories FS-06 onwards)

```markdown
# Story FS-XX: [Title]

**Status:** Draft
**Epic source:** [Epic + US number]
**Depends on:** FS-YY (Done)
**Blocks:** FS-ZZ

---

## Story
As a [persona], I want [action] so that [outcome].

## Acceptance Criteria
1. Given ... when ... then ...

## Tasks / Subtasks
**Backend:**
- [ ] task

**Frontend:**
- [ ] task

## Dev Notes
[Deviations from architecture.md, simplifications, and why]

## Definition of Done
- [ ] All ACs pass manually
- [ ] Status updated to Done
```
