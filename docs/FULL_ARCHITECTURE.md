# FactoryShield — Full Architecture Plan
**BMAD Phase 2: Architecture | Author: Asif | Date: 2026-07-01**
**Sources:** Epic 1 (Reporter), Epic 2 (Approver Workflow), Epic 2/3 (Resolver + Governance), Investigation Workspace (Figma)**

---

## 0. Purpose of This Document

Four PRDs were written independently and conflict in several places. This document is the **BMAD Architecture deliverable** — it reads all four, resolves every conflict into one canonical decision, and defines the single source of truth for:

- State machine (which version wins)
- Data model (which fields go where)
- RBAC (who can do what)
- API contract (what the frontend calls)
- Backend module structure
- Frontend component structure
- MVP cut vs. full spec

> **Rule:** If a PRD and this document conflict, this document wins.

---

## 1. Conflict Log — What the PRDs Disagreed On

### Conflict 1: Severity Representation

| PRD | Said |
|---|---|
| Epic 1 (Reporter) | Severity = display label: `Low / Medium / High` |
| Epic 2 (Approver) | Severity = sortable integer for queue ordering |
| Governance Spec | Severity = L-code: `L1 / L2 / L3 / L4` |
| Resolver Epic | Severity = `CRITICAL / HIGH / MEDIUM / LOW` strings |

**Resolution:** Store `severity` as `SMALLINT 1–4` in the database. Every label is a **presentation-layer projection** — never a separate stored column.

| DB value | L-code | Resolver label | Reporter label |
|---|---|---|---|
| 1 | L1 | CRITICAL | High |
| 2 | L2 | HIGH | High |
| 3 | L3 | MEDIUM | Medium |
| 4 | L4 | LOW | Low |

---

### Conflict 2: Incident Status / State Machine

| PRD | Said |
|---|---|
| Governance Spec | 16 states: `DRAFT → SUBMITTED_LOCAL → SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → PENDING_EVIDENCE → INVESTIGATION → RCA_REVIEW → CAPA_EXECUTION → VERIFICATION → RESOLVED → CLOSED` + `REJECTED / WITHDRAWN / REOPENED` |
| Epic 1 | 5 display states: `Submitted / Under Review / In Progress / Resolved / Rejected` |
| Resolver Epic | 6 states: `OPEN / IN_PROGRESS / INVESTIGATION / PENDING_APPROVAL / CLOSED / REJECTED` |

**Resolution:** The Governance Spec's 16-state machine is **canonical** and lives in the database. The other two are **read-layer projections** computed at query time — never stored separately.

```
incidents.status (canonical DB enum, 16 states)
        ├─→ Reporter display_status (5 values, computed)
        └─→ Resolver incident_status (6 values, computed)
```

---

### Conflict 3: Role Count

| PRD | Said |
|---|---|
| Epic 1 | 3 roles: Reporter, Approver, Admin |
| Epic 2 | 2-level Approver (L1 Supervisor, L2 Safety/Compliance) |
| Governance Spec | 8 roles: Reporter, Approver L1, Approver L2, Resolver, Manager, Safety Officer, Compliance Officer, Plant Manager, Admin |

**Resolution:** Full spec uses **9 roles** (listed in §6). MVP builds **3 roles** (Reporter, Approver, Resolver) — no L1/L2 split, no dual-control. The role table is seeded for 9 from day 1; the policies are wired for MVP roles only. Adding L2 later is adding a policy + seeding data, not a schema change.

---

### Conflict 4: Approval Stage Naming

| PRD | Said |
|---|---|
| Governance Spec | `RCA_SIGNOFF, CAPA_VERIFICATION, CASE_CLOSURE` |
| Resolver Epic | `CLOSE_INVESTIGATION, CAPA_VERIFICATION, ROOT_CAUSE_SIGN_OFF, RESOLUTION_FINAL` |

**Resolution:** Canonical 4-value `approval_type` enum (Resolver Epic naming wins — clearer):

| approval_type | Fires when |
|---|---|
| `CLOSE_INVESTIGATION` | Investigation checklist 100% complete |
| `ROOT_CAUSE_SIGN_OFF` | RCA_REVIEW stage, dual-control |
| `CAPA_VERIFICATION` | VERIFICATION stage, dual-control |
| `RESOLUTION_FINAL` | RESOLVED → CLOSED, dual-control |

---

### Conflict 5: Department Storage

| PRD | Said |
|---|---|
| Governance Spec | Full `departments` table with FK on `incidents` |
| MVP stories | Department used as a free-text field, no management UI |

**Resolution (documented deviation):** Store `department` as `VARCHAR` on `incidents` for MVP. The `departments` table is defined in the full schema (§4) but not wired to a FK until a Department Management story is built. Deviation noted in `Incident` entity XML comment.

---

### Conflict 6: Investigation Workspace Fields

| PRD | Said |
|---|---|
| Governance Spec | `investigation_notes, root_cause_code, methodology_used, methodology_rationale` |
| Figma (Investigation Workspace) | `Owner, InvestigationDate, TargetCompletion, RiskLevel, Notes, FindingsSummary, ImmediateActionTaken, LessonsLearned` + 8-item checklist + timeline + evidence |

**Resolution:** Figma wins on UI fields (it's the UX specification). Governance Spec fields (`root_cause_code, methodology_used`) are additive — they go in the same `investigations` table as separate nullable columns, activated when the Resolver submits the RCA phase.

---

## 2. Technology Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Backend | ASP.NET Core Web API | .NET 10 | Clean Architecture, CQRS via MediatR, EF Core + Npgsql |
| Frontend | Angular | 19 | Standalone components, signal-based state, role-based routing |
| Database | PostgreSQL | 16 | Native `CHECK` constraints, partial indexes, JSONB for audit |
| Auth | JWT Bearer | — | ASP.NET Core Identity + `[Authorize(Policy = ...)]` |
| File storage | Local disk (MVP) | — | Behind `IFileStorageService` abstraction — swap to S3 later |
| Background jobs | Hangfire | — | SLA clock checks every 5 min, escalation nudges |
| Deployment | On-premise single-factory | — | No multi-tenant schema for pilot |

---

## 3. Canonical State Machine

### 3.1 Full 16-State Machine (Governance Spec — canonical)

```
DRAFT
  └─→ SUBMITTED_LOCAL
        └─→ SUBMITTED ──────────────────────────────────────────────────┐
              └─→ TRIAGED                                                │
                    └─→ ASSIGNED                                         │  REJECTED
                          └─→ IN_PROGRESS                               │  (Soft: dispute window)
                                ├─→ PENDING_EVIDENCE                    │  (Hard: final)
                                │     └─→ back to IN_PROGRESS           │
                                │                                        │
                     (severity ≥ L2 OR loss > threshold)                │
                                │                                        │
                                └─→ INVESTIGATION                        │
                                      └─→ (checklist 100%)              │
                                            └─→ RCA_REVIEW              │
                                                  ├─→ [REJECT] back to INVESTIGATION
                                                  └─→ [APPROVE: ROOT_CAUSE_SIGN_OFF]
                                                        └─→ CAPA_EXECUTION
                                                              └─→ (all CAPA tasks closed)
                                                                    └─→ VERIFICATION
                                                                          ├─→ [REJECT] back to CAPA_EXECUTION
                                                                          └─→ [APPROVE: CAPA_VERIFICATION]
                                                                                └─→ RESOLVED
                                                                                      └─→ [APPROVE: RESOLUTION_FINAL]
                                                                                            └─→ CLOSED
                                                                                                  └─→ [REOPENED] back to pipeline

SUBMITTED/TRIAGED ──[Withdraw]──→ WITHDRAWN
CLOSED ─────────────[Reopen]───→ re-enters at INVESTIGATION
```

**Below-L2 severity (Low/Medium):** Skip INVESTIGATION→VERIFICATION pipeline entirely.
Path: `ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED` (simple resolution).

### 3.2 MVP 7-State Subset (what is built now)

```
SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
                │
                └─→ REJECTED
```

`IIncidentStateMachine.TransitionAsync(incident, targetState, actor)` is the **only place** that writes `Incident.Status`. Direct assignment is prohibited. The interface accepts both the MVP 7 states and the full 16 — so adding INVESTIGATION later requires no interface change.

### 3.3 Projection Maps

**→ Reporter `display_status`:**

| Canonical | Reporter sees |
|---|---|
| DRAFT, SUBMITTED_LOCAL | (pre-submission, not visible) |
| SUBMITTED, TRIAGED | Submitted |
| ASSIGNED, IN_PROGRESS, PENDING_EVIDENCE, INVESTIGATION, RCA_REVIEW, CAPA_EXECUTION, VERIFICATION | In Progress |
| RESOLVED | Resolved |
| CLOSED | Resolved (locked) |
| REJECTED | Rejected |
| WITHDRAWN | Withdrawn |

**→ Resolver `incident_status`:**

| Canonical | Resolver sees |
|---|---|
| SUBMITTED, TRIAGED | OPEN |
| ASSIGNED, IN_PROGRESS, PENDING_EVIDENCE | IN_PROGRESS |
| INVESTIGATION, RCA_REVIEW, CAPA_EXECUTION, VERIFICATION | INVESTIGATION |
| (pending approval event) | PENDING_APPROVAL |
| CLOSED | CLOSED |
| REJECTED | REJECTED |

---

## 4. Full Data Model (PostgreSQL)

### 4.1 Identity & Organisation

```sql
factories(id UUID PK, name VARCHAR, address TEXT, timezone VARCHAR)

departments(id UUID PK, factory_id FK → factories, name VARCHAR)

roles(id UUID PK, code VARCHAR UNIQUE)
  -- Seeded: REPORTER, APPROVER, APPROVER_L2, RESOLVER, MANAGER,
  --         SAFETY_OFFICER, COMPLIANCE_OFFICER, PLANT_MANAGER, ADMIN

users(
  id UUID PK,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  preferred_language VARCHAR DEFAULT 'en',
  employment_type VARCHAR,         -- permanent, contractor, visitor
  department_id FK → departments NULL,  -- nullable (deviation: MVP uses string)
  is_active BOOL DEFAULT true
)

user_roles(
  user_id FK → users,
  role_id FK → roles,
  approval_level SMALLINT NULL,    -- 1 or 2, used for Approver routing
  PRIMARY KEY (user_id, role_id)
)
```

### 4.2 Incident Core

```sql
incidents(
  id UUID PK,
  incident_reference VARCHAR UNIQUE,   -- INC-{YYYY}-{NNNN}, generated in app layer
  factory_id FK → factories NULL,
  department VARCHAR NULL,             -- [DEVIATION] string, not FK, until Dept Management story
  line VARCHAR NULL,
  equipment VARCHAR NULL,
  category VARCHAR NOT NULL,
  severity SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 4),   -- 1=CRITICAL, 4=LOW
  status VARCHAR NOT NULL,             -- canonical 16-state enum (§3.1)
  source_channel VARCHAR DEFAULT 'app',  -- app, kiosk, qr, guest
  reporting_mode VARCHAR DEFAULT 'normal',  -- normal, confidential, anonymous_guest, anonymous_qr
  reporter_id FK → users NULL,         -- NULL for anonymous
  reporter_visibility VARCHAR DEFAULT 'visible',  -- visible, masked, hidden
  anonymous_reference_token VARCHAR NULL,
  short_description TEXT NOT NULL,
  business_impact_estimated_loss_usd NUMERIC NULL,
  qr_code_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_event_time TIMESTAMPTZ NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_due_date TIMESTAMPTZ NULL,
  -- Approver decision fields
  assigned_resolver_id FK → users NULL,
  approval_decision VARCHAR NULL,      -- Approve, SoftReject, HardReject
  reject_reason VARCHAR NULL,
  dispute_window_until TIMESTAMPTZ NULL,
  dispute_status VARCHAR NULL,         -- None, Disputed, Dispute_Expired
  -- Sprint 6 additions
  route_count INT DEFAULT 0,           -- reassignment counter; triggers loop guard at ≥ 2
  loop_guard_triggered BOOL DEFAULT false,
  merged_into_id FK → incidents NULL   -- set on MERGED_CLOSED duplicate; points to primary
)

-- Claim/lock ownership (Epic 2 US-2)
incident_claims(
  id UUID PK,
  incident_id FK → incidents,
  claimed_by FK → users,
  claimed_at TIMESTAMPTZ NOT NULL,
  claim_timeout_minutes INT DEFAULT 30,
  released_by FK → users NULL,
  released_at TIMESTAMPTZ NULL,
  release_reason VARCHAR NULL          -- manual, auto_timeout, decision_made, escalated
)

-- Re-routing loop guard (Epic 2 US-6)
incident_routing_log(
  id UUID PK,
  incident_id FK → incidents,
  from_level SMALLINT,
  to_level SMALLINT,
  reroute_count INT DEFAULT 1,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- THE canonical append-only audit timeline (REVOKE UPDATE, DELETE for app role)
incident_state_log(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  event_type VARCHAR NOT NULL,         -- STATUS_CHANGE, CLAIM, RELEASE, DECISION, ESCALATION, MERGE, etc.
  event_subtype VARCHAR NULL,
  actor_id FK → users NULL,           -- NULL = system event (SLA auto-escalation)
  previous_value JSONB NULL,
  new_value JSONB NULL,
  related_entity_id UUID NULL,
  visibility_scope VARCHAR DEFAULT 'PUBLIC',  -- PUBLIC, INTERNAL, RESTRICTED
  metadata_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
-- DB-level protection: REVOKE UPDATE, DELETE ON incident_state_log FROM app_role
```

### 4.3 Evidence

```sql
attachments(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  attachment_type VARCHAR NOT NULL,    -- photo, voice_note, document
  upload_status VARCHAR DEFAULT 'UPLOADED',
  mime_type VARCHAR NOT NULL,
  file_size BIGINT NOT NULL,
  storage_key VARCHAR NOT NULL,        -- relative path on disk / S3 key
  sha256_hash VARCHAR NOT NULL,
  uploaded_by FK → users NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_note VARCHAR NULL,          -- investigator's caption
  is_initial_evidence BOOL DEFAULT false
)
```

### 4.4 Investigation Workspace

```sql
investigations(
  id UUID PK,
  incident_id FK → incidents UNIQUE NOT NULL,   -- 1-to-1 per incident
  owner_id FK → users NULL,            -- "Investigation Owner" from Figma
  investigation_date TIMESTAMPTZ NULL,
  target_completion TIMESTAMPTZ NULL,
  risk_level SMALLINT DEFAULT 2,       -- 1=High, 2=Medium, 3=Low
  -- Figma text fields
  notes TEXT NULL,
  findings_summary TEXT NULL,
  immediate_action_taken TEXT NULL,
  lessons_learned TEXT NULL,
  -- Governance Spec RCA fields (additive, activated at RCA phase)
  root_cause_code VARCHAR NULL,
  root_cause_description VARCHAR(500) NULL,
  investigation_methodology_used VARCHAR NULL,
  methodology_rationale TEXT NULL,
  -- CHECK: char_length(trim(methodology_rationale)) >= 50 WHEN methodology_used = 'OTHER'
  reporter_followup_requested BOOL DEFAULT false,
  reporter_followup_resolved BOOL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

investigation_checklist_items(
  id UUID PK,
  investigation_id FK → investigations NOT NULL,
  text VARCHAR NOT NULL,
  is_completed BOOL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  sort_order SMALLINT NOT NULL
)
-- Default 8 items seeded on OpenInvestigation:
-- 1. Review incident scene photos and videos
-- 2. Collect witness statements from all involved parties
-- 3. Inspect equipment and machinery involved
-- 4. Check PPE compliance records
-- 5. Review previous incidents in same area
-- 6. Document environmental conditions at time of incident
-- 7. Review relevant SOPs and work instructions
-- 8. Assess training records of involved personnel

investigation_timeline_events(
  id UUID PK,
  investigation_id FK → investigations NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  description VARCHAR NOT NULL,
  actor_id FK → users NULL
)
```

### 4.5 Corrective Actions (CAPA)

```sql
corrective_actions(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NULL,
  assigned_owner FK → users NULL,
  due_date TIMESTAMPTZ NULL,
  priority SMALLINT DEFAULT 3,         -- 1=Critical, 4=Low
  completion_percentage SMALLINT DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  action_status VARCHAR DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
  verified_by FK → users NULL,
  verified_at TIMESTAMPTZ NULL
)
```

### 4.6 Approval Events (dual-control, append-only)

```sql
approval_events(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  approval_type VARCHAR NOT NULL,      -- CLOSE_INVESTIGATION, ROOT_CAUSE_SIGN_OFF, CAPA_VERIFICATION, RESOLUTION_FINAL
  action VARCHAR NOT NULL,             -- APPROVE, REJECT, REQUEST_CHANGES
  actor_id FK → users NOT NULL,
  comment TEXT NOT NULL,
  -- CHECK: char_length(comment) >= 10 WHEN action IN ('REJECT','REQUEST_CHANGES')
  validated_by_user_id FK → users NULL,  -- required when AI-informed decision
  source_artifact_ref VARCHAR NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
-- DB-level: REVOKE UPDATE, DELETE ON approval_events FROM app_role
```

### 4.7 SLA Engine

```sql
sla_clocks(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  clock_type VARCHAR NOT NULL,         -- TRIAGE, ASSIGNMENT, RESOLUTION, INVESTIGATION, RCA, CAPA, VERIFICATION
  started_at TIMESTAMPTZ NOT NULL,
  paused_at TIMESTAMPTZ NULL,          -- set when RequestInfo pauses SLA; cleared on ProvideInfo
  accumulated_pause_minutes INT DEFAULT 0,  -- total paused time; subtracted from elapsed in SlaCheckJob
  target_seconds INT NOT NULL,
  stage VARCHAR DEFAULT 'ON_TRACK',    -- ON_TRACK, AT_RISK (50%), WARNING (80%), BREACHED
  warning_50_fired BOOL DEFAULT false,
  warning_80_fired BOOL DEFAULT false
)
```

### 4.8 Escalations & Notifications

```sql
escalations(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  escalation_source VARCHAR NOT NULL,  -- manual, sla_auto, loop_guard
  escalation_level INT DEFAULT 1,
  escalated_to FK → users NULL,
  escalation_reason TEXT NULL,
  escalation_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ NULL,
  resolution VARCHAR NULL
)

notifications(
  id UUID PK,
  recipient_role VARCHAR NULL,
  recipient_user_id FK → users NULL,
  channel VARCHAR NOT NULL,            -- push, in_app, sms, email
  trigger_event VARCHAR NOT NULL,
  sent_at TIMESTAMPTZ NULL,
  delivery_status VARCHAR DEFAULT 'PENDING',
  batched BOOL DEFAULT false,
  batch_window_minutes INT NULL
)
```

### 4.9 Offline Sync (Reporter)

```sql
offline_drafts(
  id UUID PK,
  local_draft_id VARCHAR NOT NULL,
  server_incident_id FK → incidents NULL,
  payload_hash VARCHAR NOT NULL,       -- SHA-256 of payload for dedup
  sync_status VARCHAR DEFAULT 'DRAFT', -- DRAFT, QUEUED, SYNCING, SYNCED, SYNC_FAILED
  sync_attempt_count INT DEFAULT 0,
  local_event_time TIMESTAMPTZ NULL,
  sync_error_message TEXT NULL
)
```

### 4.10 Confidentiality Audit

```sql
identity_access_audit(
  id UUID PK,
  incident_id FK → incidents NOT NULL,
  actor_id FK → users NOT NULL,
  accessed_field VARCHAR NOT NULL,
  reason VARCHAR NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

---

## 5. SLA Engine Design

One engine serves Epic 1 (Reporter SLA visibility), Epic 2 (Approver queue sort), and the Resolver CAPA overdue tracking.

**Hangfire recurring job (every 5 minutes):**
1. Load all `sla_clocks` where `stage != 'BREACHED'` and `paused_at IS NULL`
2. For each: compute elapsed = `now() - started_at`; percentage = `elapsed / target_seconds * 100`
3. If `percentage >= 50` and `warning_50_fired = false` → fire SLA_WARNING notification, set flag
4. If `percentage >= 80` and `warning_80_fired = false` → fire SLA_CRITICAL notification, set flag
5. If `percentage >= 100` → set `stage = 'BREACHED'`; write `escalations` row; write `incident_state_log` entry; auto-escalate per routing config

**No-duplicate-notification rule (Epic 2 US-10):** The `warning_50_fired` and `warning_80_fired` boolean columns on `sla_clocks` ensure each threshold fires exactly once per incident, per stage.

---

## 6. RBAC Matrix

| Role | Code | Reads | Writes | Key restriction |
|---|---|---|---|---|
| Reporter | `REPORTER` | Own incidents only (`display_status` projection) | Create incident, add follow-up evidence, dispute soft rejection | Never sees RCA, CAPA, investigation notes, or audit trail |
| Approver L1 | `APPROVER` | Incidents routed to their level | Claim, Approve, Soft Reject, Hard Reject, Reassign, Escalate, Merge, Request Info | Cannot claim an incident already claimed by another L1 |
| Approver L2 | `APPROVER_L2` | Same as L1 + confidential identity if authorized | Same as L1 + identity unmask (logged to `identity_access_audit`) | Every unmask logged; SoD: cannot be the only approver on two consecutive dual-control stages |
| Resolver | `RESOLVER` | Assigned incidents only | Investigation workspace, CAPA actions, resolve, submit-approval | No access to incidents not assigned to them |
| Manager | `MANAGER` | All incidents in factory | Approval events: `ROOT_CAUSE_SIGN_OFF`, `RESOLUTION_FINAL` | — |
| Safety Officer | `SAFETY_OFFICER` | All incidents in factory | CAPA verification sign-off | — |
| Compliance Officer | `COMPLIANCE_OFFICER` | All incidents + cross-reporter patterns | All 4 approval event types, CASE_REOPEN | Cannot self-approve two consecutive dual-control stages on same case (SoD) |
| Plant Manager | `PLANT_MANAGER` | All incidents + KPI dashboard | Approval events: `ROOT_CAUSE_SIGN_OFF`, `CAPA_VERIFICATION`, `RESOLUTION_FINAL` | — |
| Admin | `ADMIN` | Everything | RBAC config, SLA threshold config, routing rules, tiebreak decisions | — |

**Enforcement:** `[Authorize(Policy = "RoleName")]` on every endpoint, backed by `IAuthorizationHandler` per policy. The Angular `role.guard` is UX only — never the actual security boundary.

**MVP active policies (Phase 1):** `ApproverOnly` (checks `APPROVER` role). Reporter and Resolver endpoints use `[Authorize]` only. Full role policies added per story.

---

## 7. API Contract (`/api/v1`)

### Reporter
```
POST   /incidents                            Create incident
POST   /incidents/{id}/attachments           Upload evidence (multipart, 6MB limit)
GET    /incidents/mine                        Reporter's own incidents (display_status projection)
POST   /incidents/offline-sync               Batch sync offline drafts
POST   /incidents/{id}/follow-up             Add supplemental evidence/clarification
POST   /incidents/{id}/dispute               Dispute a soft rejection (within window)
```

### Approver
```
GET    /approver/queue                        Filtered + sorted review queue (SUBMITTED only)
POST   /incidents/{id}/claim                  Claim incident
POST   /incidents/{id}/release-claim          Release claim
POST   /incidents/{id}/approve               { resolverUserId, handoffNote? }
POST   /incidents/{id}/reject                { rejectType: Soft|Hard, reason (≥10 chars) }
POST   /incidents/{id}/reassign              { category?, severity?, reason }
POST   /incidents/{id}/escalate              { note? }
POST   /incidents/{id}/merge                 { primaryIncidentId, reason }
POST   /incidents/{id}/request-info          { question }
GET    /approver/resolvers                    List available Resolvers for assignment dropdown
```

### Resolver
```
GET    /resolver/assigned                     Assigned incidents (filterable: severity, dept, status, due_date)
POST   /incidents/{id}/investigation          Open investigation (creates Investigation + 8 checklist items)
GET    /incidents/{id}/investigation          Get full Investigation Workspace DTO
PUT    /incidents/{id}/investigation          Save investigation fields (notes, findings, risk, etc.)
POST   /incidents/{id}/investigation/checklist/{itemId}/toggle    Toggle checklist item
POST   /incidents/{id}/actions                Create CAPA action
PATCH  /actions/{id}                          Update CAPA action (status, completion %)
POST   /incidents/{id}/resolve               { resolutionSummary } or escalate
POST   /incidents/{id}/submit-approval       { approvalType }
```

### Governance / Shared
```
GET    /incidents/{id}/timeline               Full audit trail (visibility_scope-filtered per caller role)
POST   /approvals/{incidentId}               { approvalType, action, comment, validatedByUserId? }
GET    /dashboard/executive                   KPI scorecard
GET    /dashboard/compliance                  Compliance officer view
```

---

## 8. Backend Module Structure

```
src/
├── FactoryShield.Domain/
│   ├── Entities/
│   │   ├── Incident.cs              — status written ONLY via IIncidentStateMachine
│   │   ├── User.cs
│   │   ├── Role.cs
│   │   ├── Attachment.cs
│   │   ├── Investigation.cs
│   │   ├── InvestigationChecklistItem.cs
│   │   ├── InvestigationTimelineEvent.cs
│   │   ├── CorrectiveAction.cs
│   │   ├── ApprovalEvent.cs
│   │   ├── IncidentStateLog.cs
│   │   ├── IncidentClaim.cs         — Sprint 6: claim/lock (30-min auto-expiry)
│   │   ├── IncidentRoutingLog.cs    — Sprint 6: reassignment audit trail
│   │   └── SLAClock.cs
│   └── Enums/
│       ├── IncidentStatus.cs        — extended in Sprint 6: MergedClosed=7, PendingReporterInput=8
│       ├── ApprovalDecision.cs      — Approve, SoftReject, HardReject
│       ├── ApprovalType.cs          — 4 dual-control approval types
│       ├── RiskLevel.cs             — High=1, Medium=2, Low=3
│       └── ActionStatus.cs
│
├── FactoryShield.Application/
│   ├── Auth/
│   │   └── Commands/ LoginCommand + Handler
│   ├── Incidents/
│   │   ├── Commands/ CreateIncidentCommand, UploadAttachmentCommand
│   │   ├── Queries/  GetMyIncidentsQuery, GetIncidentTimelineQuery
│   │   └── Models/   IncidentSummaryDto, CreateIncidentResult
│   ├── Approver/
│   │   ├── Commands/ ApproveIncidentCommand, RejectIncidentCommand,
│   │   │             ReassignIncidentCommand, EscalateIncidentCommand,
│   │   │             MergeIncidentCommand, RequestInfoCommand,
│   │   │             ClaimIncidentCommand, ReleaseClaimCommand
│   │   └── Queries/  GetApproverQueueQuery, GetResolversQuery
│   ├── Investigation/
│   │   ├── Commands/ OpenInvestigationCommand, SaveInvestigationCommand,
│   │   │             ToggleChecklistItemCommand, AddTimelineEventCommand
│   │   └── Queries/  GetInvestigationQuery
│   ├── Resolver/
│   │   ├── Commands/ CreateCorrectiveActionCommand, UpdateCorrectiveActionCommand,
│   │   │             ResolveIncidentCommand, SubmitApprovalCommand
│   │   └── Queries/  GetAssignedIncidentsQuery
│   ├── Incidents/
│   │   ├── Commands/ ProvideInfoCommand              — Sprint 6: Reporter submits info, resumes SLA
│   │   └── Queries/  DisplayStatusMapper.cs          — maps canonical status → display string
│   └── Common/
│       └── Interfaces/
│           ├── IIncidentStateMachine.cs   — single TransitionAsync choke point
│           ├── ISlaEngine.cs
│           ├── IConfidentialityService.cs — maskIfNeeded() wraps every incident read
│           ├── IFileStorageService.cs
│           ├── IIncidentRepository.cs     — extended: GetByIdAsync, GetByStatusesAsync
│           ├── IInvestigationRepository.cs
│           ├── IAttachmentRepository.cs
│           ├── IIncidentClaimRepository.cs  — Sprint 6
│           ├── IRoutingLogRepository.cs     — Sprint 6
│           └── IUserRepository.cs
│
├── FactoryShield.Infrastructure/
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/         — one IEntityTypeConfiguration<T> per entity
│   │   ├── Repositories/           — one repository class per interface
│   │   └── Migrations/
│   ├── Services/
│   │   ├── IncidentStateMachine.cs
│   │   ├── LocalFileStorageService.cs
│   │   ├── JwtService.cs
│   │   ├── PasswordVerifier.cs
│   │   └── ConfidentialityService.cs
│   └── BackgroundJobs/
│       ├── SlaCheckJob.cs          — Hangfire recurring, every 5 min; skips paused clocks
│       ├── ClaimReleaseJob.cs      — Sprint 6: auto-releases expired IncidentClaims every 5 min
│       └── EscalationNudgeJob.cs
│
└── FactoryShield.Api/
    ├── Controllers/
    │   ├── AuthController.cs
    │   ├── IncidentController.cs   — Reporter endpoints
    │   ├── ApproverController.cs   — Approver queue + decisions
    │   ├── InvestigationController.cs  — Investigation Workspace (Resolver)
    │   ├── ResolverController.cs   — Assigned list, CAPA, resolve
    │   ├── GovernanceController.cs — Approvals, timeline, dashboards
    │   └── HealthController.cs
    ├── Policies/
    │   └── AuthorizationPolicies.cs
    └── Program.cs
```

### Key architectural invariant
`IIncidentStateMachine.TransitionAsync(incident, targetState, actor)` is the **only** place that writes `Incident.Status`. Every command handler receives it via DI. No controller, no entity constructor, no seeder writes status directly. This is what makes the 16-state machine actually enforced — not just documented.

---

## 9. Frontend Component Structure (Angular 19)

```
frontend/src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts          — JWT storage, role extraction from claims
│   │   └── incident.service.ts      — all HTTP calls (grows per phase)
│   └── interceptors/
│       └── auth.interceptor.ts      — attaches Bearer token
│
├── shared/
│   ├── components/
│   │   ├── status-badge/            — maps canonical status → display_status per role
│   │   ├── severity-badge/          — 1–4 → label + CSS class
│   │   └── sla-countdown/           — shared across Approver + Resolver views
│   └── guards/
│       └── role.guard.ts            — UX-only route gate (backend always re-validates)
│
└── features/
    ├── auth/
    │   └── login.component.ts
    ├── dashboard/
    │   └── dashboard.component.ts
    ├── incidents/                   — Reporter persona
    │   ├── report-form/             report-form.component.ts
    │   ├── my-incidents/            my-incidents-list.component.ts
    │   └── incident-detail/         incident-detail.component.ts
    ├── approver/                    — Approver persona
    │   ├── approver-queue.component.ts
    │   └── incident-detail-stub.component.ts  → evolves into full decision panel
    ├── investigation/               — Resolver persona (Investigation Workspace, Figma)
    │   ├── investigation-workspace.component.ts   (main container)
    │   ├── investigation-details.component.ts     (left panel — notes, findings, risk)
    │   ├── evidence-panel.component.ts             (upload + list, reuses attachment service)
    │   ├── checklist-panel.component.ts            (3/8 checkboxes)
    │   ├── timeline-panel.component.ts             (events list)
    │   └── ai-assistant-panel.component.ts         (stub — "Analyze Root Causes" button)
    ├── resolver/                    — Resolver persona (CAPA)
    │   ├── assigned-dashboard.component.ts
    │   └── capa-tracker.component.ts
    └── governance/                  — Manager / Compliance persona
        ├── executive-dashboard.component.ts
        └── compliance-dashboard.component.ts
```

### Route table

| Path | Component | Guard / Policy |
|---|---|---|
| `/login` | LoginComponent | public |
| `/dashboard` | DashboardComponent | `roleGuard` |
| `/report` | ReportFormComponent | `roleGuard` |
| `/my-incidents` | MyIncidentsListComponent | `roleGuard` |
| `/incidents/:id` | IncidentDetailComponent | `roleGuard` |
| `/approver/queue` | ApproverQueueComponent | `roleGuard` (APPROVER role) |
| `/approver/incidents/:id` | IncidentDetailStubComponent | `roleGuard` (APPROVER role) |
| `/incidents/:id/investigation` | InvestigationWorkspaceComponent | `roleGuard` (RESOLVER role) |
| `/resolver/assigned` | AssignedDashboardComponent | `roleGuard` (RESOLVER role) |
| `/governance/executive` | ExecutiveDashboardComponent | `roleGuard` (MANAGER / PLANT_MANAGER) |

---

## 10. Non-Functional Invariants

| Concern | Mechanism |
|---|---|
| **Audit immutability** | `REVOKE UPDATE, DELETE ON incident_state_log, approval_events FROM app_role` at Postgres role level — not just application code |
| **Confidentiality chokepoint** | `ConfidentialityService.MaskIfNeeded()` called on every incident read — one method, never scattered `if (role == ...)` across controllers |
| **Status write chokepoint** | `IIncidentStateMachine.TransitionAsync` is the only path that touches `Incident.Status` |
| **Offline dedup** | `payload_hash` (SHA-256 of offline payload) prevents duplicate incidents on repeated sync attempts |
| **SLA no-duplicate-alert** | `warning_50_fired` / `warning_80_fired` booleans on `sla_clocks` — each threshold fires once per incident per stage |
| **Routing loop guard** | `incident_routing_log.reroute_count` — if an incident would route back to a level it already passed through, the system blocks re-route and flags `tiebreak_pending` |
| **File storage abstraction** | `IFileStorageService` — MVP uses `LocalFileStorageService` (disk); swapping to `S3FileStorageService` requires zero changes to command handlers |

---

## 11. Migration Strategy

| Migration name | Adds |
|---|---|
| `InitialCreate` | `users`, `roles` |
| `AddAuthFields` | `password_hash`, `role_id` on users |
| `AddIncidentFields` | `incidents` table (MVP fields) |
| `AddAttachments` | `attachments` table |
| `AddApprovalFields` | `assigned_resolver_id`, `decision`, `reject_reason` on incidents |
| `AddInvestigation` | `investigations`, `investigation_checklist_items`, `investigation_timeline_events` |
| `AddCorrectiveActions` | `corrective_actions` |
| `AddFullStateLog` | `incident_state_log` |
| `AddSlaClocks` | `sla_clocks` |
| `AddEscalations` | `escalations`, `notifications` |
| `AddOfflineSync` | `offline_drafts` |
| `AddSprint6` | `incident_claims`, `incident_routing_log`; adds `route_count`, `loop_guard_triggered`, `merged_into_id` to `incidents`; adds `paused_at`, `accumulated_pause_minutes` to `sla_clocks`; adds `MergedClosed=7`, `PendingReporterInput=8` to status enum |
| `AddConfidentialityAudit` | `identity_access_audit` |
| `AddApprovalEvents` | `approval_events` (dual-control) |

Each migration is written when the corresponding story is built — not all at once.

---

## 12. MVP Cut (Phase 1 — Built)

### Done (Sprints 0–6)
- [x] Auth: JWT login, 3 roles (Reporter, Approver, Resolver)
- [x] Incident CRUD: `POST /incidents`, `GET /incidents/mine`
- [x] Attachments: `POST /incidents/{id}/attachments` (multipart, 6MB, SHA-256)
- [x] State machine: MVP subset via `IIncidentStateMachine` (SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED + REJECTED + MergedClosed + PendingReporterInput)
- [x] Approver queue: `GET /approver/queue` (SUBMITTED + PendingReporterInput, sorted severity DESC + age ASC)
- [x] Approve: `POST /incidents/{id}/approve` (assigns Resolver, → TRIAGED)
- [x] Reject: `POST /incidents/{id}/reject` (Soft/Hard, reason ≥10 chars, → REJECTED)
- [x] Investigation workspace: Open, save, checklist toggle, evidence panel, timeline
- [x] CAPA tracker: `corrective_actions` table, create + update + resolve
- [x] AI root cause assistant: stub panel (no backend)
- [x] SLA engine: `sla_clocks`, Hangfire `SlaCheckJob` every 5 min, staged warnings 50%/80%/breach
- [x] Escalation: manual + SLA auto-escalation
- [x] Claim/lock: `incident_claims`, `ClaimIncidentCommand`, `ReleaseClaimCommand`, `ClaimReleaseJob`
- [x] Reassign + loop guard: `IncidentRoutingLog`, `RouteCount`, `LoopGuardTriggered`
- [x] Merge duplicates: `MergeIncidentCommand`, `MergedIntoId`, `MergedClosed` status
- [x] Request info / SLA pause: `RequestInfoCommand` pauses `SlaClocks.PausedAt`; `ProvideInfoCommand` resumes + accumulates `AccumulatedPauseMinutes`
- [x] Angular: Login, Dashboard, Report Form, My Incidents, Approver Queue (claim UI), Approver Detail, Investigation Workspace, Resolver Assigned list, CAPA tracker, RCA stub

### Next (Sprint 7 — Governance)
- [ ] Full 16-state machine — extend `IIncidentStateMachine` to all 16 states including INVESTIGATION sub-pipeline
- [ ] Dual-control approval events — `ApprovalEvent` entity, SoD enforcement, 2-actor gate
- [ ] Executive dashboard — KPI scorecard (counts, avg resolution time, CAPA rate)

### Deferred (Post-Sprint 7) — **Verified 2026-07-02: all built, see §13**
- ~~Offline sync~~ ✅ Done (FS-25)
- ~~Anonymous/confidential reporting, QR entry~~ ✅ Done (FS-24, FS-26)
- ~~Multi-stage full `incident_state_log` audit trail with DB-level immutability~~ ✅ Done (FS-23)
- ~~Compliance dashboard (cross-reporter pattern view)~~ ✅ Done (FS-27, incl. export/identity-audit sub-endpoints)
- ~~Real notification system (push, email, digest batching)~~ ✅ Done (FS-28) — dev-stub Email/SMS providers only, real provider swap still pending
- Multi-factory / multi-tenant — still not built (genuinely out of scope for the pilot)
- Analytics charts — backend endpoints all done (FS-27-adjacent Analytics module); frontend charting library choice unverified in this pass

---

## 13. Story Sequence (All Phases)

| Story | Title | Status |
|---|---|---|
| FS-00 | Project setup, Clean Architecture scaffolding | ✅ Done |
| FS-00b | Auth (Login, JWT, seed users) | ✅ Done |
| FS-01 | Reporter: Create Incident | ✅ Done |
| FS-02 | Reporter: Upload Attachment | ✅ Done |
| FS-03 | Reporter: My Incidents list | ✅ Done |
| FS-03b | Frontend styling pass | ✅ Done |
| FS-04 | Approver: Review Queue | ✅ Done |
| FS-05 | Approver: Approve / Reject | ✅ Done |
| FS-06 | Resolver: Assigned Incidents list | ✅ Done |
| FS-07 | Investigation: Open Workspace | ✅ Done |
| FS-08 | Investigation: Save Details (notes, risk, findings) | ✅ Done |
| FS-09 | Investigation: Checklist toggle | ✅ Done |
| FS-10 | Investigation: Evidence panel (reuse attachments) | ✅ Done |
| FS-11 | CAPA: Create & track corrective actions | ✅ Done |
| FS-12 | Resolver: Resolve incident | ✅ Done |
| FS-13 | AI Root Cause Assistant stub | ✅ Done |
| FS-14 | SLA Engine — sla_clocks, Hangfire SlaCheckJob, staged warnings | ✅ Done |
| FS-14b | SLA notifications — Hangfire, 50%/80%/breach thresholds | ✅ Done |
| FS-15 | Escalation (manual + SLA auto) | ✅ Done |
| FS-16 | Claim / lock mechanism — IncidentClaims, ClaimReleaseJob | ✅ Done |
| FS-17 | Reassign + loop guard — IncidentRoutingLog, RouteCount | ✅ Done |
| FS-18 | Merge duplicate incidents — MergedClosed status, MergedIntoId | ✅ Done |
| FS-19 | Request info + SLA pause — PausedAt, AccumulatedPauseMinutes | ✅ Done |
| FS-20 | Full 16-state machine (INVESTIGATION sub-pipeline) | ✅ Done |
| FS-21 | Dual-control approval events | ✅ Done |
| FS-22 | Executive dashboard | ✅ Done |
| FS-23 | Full incident_state_log audit trail | ✅ Done |
| FS-24 | Anonymous / confidential reporting | ✅ Done |
| FS-25 | Offline sync | ✅ Done |
| FS-26 | QR entry | ✅ Done |
| FS-27 | Compliance dashboard (7 panels + identity-access-audit + watermarked export) | ✅ Done |
| FS-28 | Notification system (in-app, email, SMS dev-stub, digest/reminder job) | ✅ Done (core) |
| FS-29 | Approver audit trail (`GET /incidents/{id}/approval-audit-trail`) | ✅ Done |
| FS-30 | Escalation lifecycle (`escalated_to`, acknowledge, 48h L2 auto-escalation) | ✅ Done |
| FS-31 | Investigation status tracking (`investigation_status`, resolve gate) | ✅ Done |
| — | Analytics: `root-cause-distribution`, `closure-rate`, `resolution-time` | ✅ Done |

> **Verified against running code 2026-07-02.** This table was last accurate as of the FS-19 cutoff (2026-07-01 draft); everything from FS-20 onward has since been implemented and confirmed live. See `docs/SPRINT_PLANNING.md` (per-sprint detail) and `docs/API_PLAN.md` (endpoint-level status) for the current source of truth — this table is kept only as a historical index of story IDs.
