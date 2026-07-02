# FactoryShield — Incident Monitoring & Operational Governance Specification

---

## Table of Contents

1. Executive Overview
2. Incident Lifecycle Monitoring Model
3. Reporting & Evidence Visibility
4. Response Time & Delay Tracking
   - 4.5 Investigation & CAPA SLAs
5. Responsibility Tracking Model
6. Incident Status Monitoring
7. Configurable SLA & Escalation Management
8. Offline Reporting & Sync Failure Monitoring
9. Anonymous/Confidential Reporting Auditability
   - 9.8 AI Output Governance
10. Dashboard Views (Executive, Supervisor, Compliance)
11. Required Reports
12. Data Model Entities for Monitoring
13. Notification Strategy
14. Responsibility Governance Matrix (RACI)
15. OpenSpec Style Acceptance Criteria
16. Non Functional Requirements
17. Operational KPI Reference
18. Assumption & Configuration Governance
19. Requirement Traceability Matrix
20. Guest Mode & QR Entry Point Monitoring
21. Report-on-Behalf Monitoring
22. Rejection Dispute Monitoring
23. Reporter Submission Funnel Monitoring
24. KPI & Traceability Addendum
25. RMG Context Entities & Business Impact Governance
26. Investigation & CAPA Governance
27. Internal GrillMe Validation Report

---

## 1. Executive Overview

### 1.1 Purpose

This specification defines how management will monitor, govern, and audit the FactoryShield Reporter application once it is operational. It is intentionally distinct from the Master PRD, which defines *what* the system does. This document defines *how* leadership will observe it, hold it accountable, and intervene when its operational guarantees are at risk.

The system under governance is a multilingual (English/Urdu) Android-first incident reporting tool deployed at iFar-Silexa (Pvt.) Ltd., supporting three reporting modes — Manual (login-based), Anonymous, and Confidential — with offline resilience, geolocation capture, voice dictation, and a 14-step submission flow that produces a high-quality incident report.

### 1.2 Governance Objectives

| # | Objective | Operational Question Answered |
|---|-----------|-------------------------------|
| GO-1 | Visibility | "Is the system actually being used, and where?" |
| GO-2 | Timeliness | "Is anything sitting too long without action?" |
| GO-3 | Accountability | "Who owns this incident right now, and is that person acting?" |
| GO-4 | Quality | "Are reports usable, or is the triage layer drowning in noise?" |
| GO-5 | Compliance | "Can we defend the audit trail to a regulator, a court, or the board?" |
| GO-6 | Resilience | "Is offline mode hiding incidents we are unaware of?" |
| GO-7 | Trust | "Can a reporter use the system without fear of retaliation?" |

### 1.3 Audience

- Executive Leadership (CFO, COO, CEO)
- Plant Manager and Shift Supervisors
- Compliance / EHS Officer
- IT Operations and Mobile Device Administrators
- Audit and Legal (read-only, on request)

### 1.4 Out of Scope

This document does not redefine:

- Field-level report form behavior (covered by Epic 1, sections 5–7)
- Authentication, data retention, and classification policies (covered by Master PRD)
- HR misconduct or grievance workflows (out of FactoryShield scope per Epic 1 §1)

### 1.5 GrillMe Hardening — Executive Level

| Challenge Raised | Resolution |
|-----------------|------------|
| "Monitoring without enforcement is theatre — what happens when a KPI is missed?" | Every monitoring KPI in this document is paired with a named owner, an escalation path, and a threshold-based action (see §7). |
| "Executives will only look at one screen — what's on it?" | §10 defines a single Executive Dashboard with a fixed KPI set and no more than 7 visual elements. |
| "Will this spec be silently bypassed during pilot?" | Section 1.6 defines a 30/60/90-day governance review cadence. |

### 1.6 Governance Cadence

| Cadence | Activity | Owner |
|---------|----------|-------|
| Daily (08:00 PKT) | SLA breach report review | Plant Manager |
| Weekly (Monday) | Incident pipeline review | Operations Lead |
| Bi-weekly | Anonymized pattern analysis | Compliance / EHS |
| Monthly | KPI scorecard submission to ExCo | COO |
| Quarterly | Governance spec review and update | Product Owner |
| Annual | External audit readiness check | Compliance Officer |

---

## 2. Incident Lifecycle Monitoring Model

### 2.1 Lifecycle Stages (as derived from Epic 1)

The Epic defines the reporter-side flow only. For governance purposes, the lifecycle is extended to the back office to make every state observable and owned:

| Stage | State Code | Definition | Monitoring Concern |
|-------|-----------|------------|-------------------|
| Drafting | DRAFT | Reporter is inside the 14-step form, has not yet submitted. | None — invisible to management by design (anti-retaliation). |
| Submitted (Local) | SUBMITTED_LOCAL | Submitted on-device, awaiting sync. | Critical monitoring blind spot — see §8. |
| Submitted (Server) | SUBMITTED | Server has received and persisted the report; system-generated ID assigned. | Entry point for SLA clock (§4). |
| Triaged | TRIAGED | Compliance / Supervisor has reviewed, assigned severity (L1–L4) and routed. | Severity classification must occur within triage SLA. |
| Assigned | ASSIGNED | Named owner (Supervisor / Engineer / EHS) is on the hook. | Responsibility tracking begins (§5). |
| In Progress | IN_PROGRESS | Owner has logged active work (evidence of motion). | Idle-time clock starts. |
| Pending Evidence | PENDING_EVIDENCE | Awaiting reporter upload or third-party information. | Idle-time clock paused, not reset. |
| Investigation *(v1.2 NEW)* | INVESTIGATION | Investigation lead is gathering facts, evidence, witness statements against an Investigation Checklist (§2.4 / §26). | Investigation SLA (§4.5); checklist-progress audit log (§4.5). |
| RCA Review *(v1.2 NEW)* | RCA_REVIEW | Root-Cause Analysis document is drafted and routed for multi-stage approval (§2.5). | RCA Approval SLA; mandatory sign-off ladder; rejection-comment enforcement (§2.5). |
| CAPA Execution *(v1.2 NEW)* | CAPA_EXECUTION | Corrective and Preventive Actions are being implemented per the approved RCA. | CAPA SLA (§4.5); E-9 Overdue CAPA escalation. |
| Verification *(v1.2 NEW)* | VERIFICATION | Independent verification of CAPA effectiveness before closure. | Verification SLA; rejection-loop back to CAPA_EXECUTION if ineffective (§2.4). |
| Resolved | RESOLVED | Owner marks complete with resolution note. | Subject to resolution SLA. |
| Closed | CLOSED | Compliance / Supervisor accepts resolution. Case archived. | Final state — read-only after T+30 days. |
| Rejected | REJECTED | Triage determines report is invalid (e.g., duplicate, non-incident). | Tracked, never deleted (§3.5). |
| Withdrawn | WITHDRAWN | Reporter voluntarily retracts (manual or confidential). | Audit trail preserved. |

### 2.2 State Transition Rules

Transitions are append-only and logged. The state machine is enforced server-side; mobile clients may only propose transitions.

### 2.3 GrillMe Hardening — Lifecycle

| Challenge Raised | Resolution |
|-----------------|------------|
| "What if a submitted report is never triaged — does it sit in limbo?" | SUBMITTED state triggers an unassigned timer (§4.3). After 2 hours with no triage action, automatic escalation to Plant Manager. |
| "Can a Supervisor 'lose' an incident by leaving it in PENDING_EVIDENCE?" | PENDING_EVIDENCE has a maximum dwell of 7 calendar days; auto-escalation to Plant Manager thereafter. |
| "What if a CLOSED case needs to be reopened?" | A REOPENED transition is permitted from CLOSED only, with mandatory justification; it is logged as a new audit event but preserves the original case ID. |
| "What if a reporter never syncs an offline report?" | §8.4 covers this explicitly with an MNO-aware stale-state alert. |
| "What about a power user spamming low-quality reports?" | §6.4 introduces a reporter-quality score, not a punitive blocklist. |
| "What if CAPA verification fails or is rejected?" *(v1.2 NEW)* | A failed VERIFICATION triggers a controlled rejection-loop back to CAPA_EXECUTION (§2.4); the rejection must carry a mandatory free-text reason (enforced by approval_event.comment, §2.5 / §12.1.10) and is logged as an approval_event with action = REJECT. The investigation_checklist_progress (12.1.9) row is rewritten — never deleted — so the failed verification is part of the immutable history. A CAPA that has been rejected more than twice auto-escalates via rule E-9 (§7.3) and flags the case as a Repeat-Failure CAPA in the Compliance Dashboard; closure is forbidden until a fresh RCA sign-off is obtained. |

### 2.4 Post-Triage Operational Stages *(v1.2 NEW)*

The lifecycle stages added in v1.1 cover the submission-to-resolution path. In practice, factory incidents that meet a minimum severity threshold (configurable; default L2 and above OR `business_impact.estimated_loss_usd > Financial Escalation Threshold`) progress through a post-triage operational pipeline before closure:

| Stage | State Code | Definition | Default Owner | Default SLA |
|-------|-----------|------------|---------------|-------------|
| Investigation | INVESTIGATION | Investigation lead gathers facts, evidence, witness statements against a checklist (e.g., "5-Whys", "Fishbone", "Interviews", "Evidence capture", "Photographic documentation", "Physical inspection", "Data pull", "Peer review"). Checklist items ticked in investigation_checklist_progress (§12.1.9). | Investigation Lead (typically the Resolver) | [Default] 24h (§4.5) |
| RCA Review | RCA_REVIEW | Root-Cause Analysis document is drafted and routed for multi-stage approval (§2.5). RCA is reviewed against quality criteria (5-Whys depth, evidence linkage, contributing-factor coverage). | RCA Author (Resolver); Compliance + Plant Manager sign-off | [Default] 72h total (draft + review) |
| CAPA Execution | CAPA_EXECUTION | Corrective Actions (immediate) and Preventive Actions (long-term) are implemented. Tasks tracked against a CAPA checklist; each task closure is logged. | CAPA Owner (Resolver) | [Default] 72h (§4.5) |
| Verification | VERIFICATION | Independent verification that CAPA actions are effective (e.g., reinspection, follow-up audit, KPI delta measurement). Verification may reject back to CAPA_EXECUTION if ineffective (§2.3 GrillMe row). | Compliance Officer (independent verification) | [Default] 48h for verification; rejection loop is unconstrained in count until fresh RCA is required |

#### 2.4.1 Stage Entry & Exit Conditions

| Stage | Entered When | Exited When |
|-------|-------------|-------------|
| INVESTIGATION | Case is in IN_PROGRESS AND (severity ≥ L2 OR estimated_loss_usd > threshold OR severity hint + reporter mode suggest formal investigation) | All checklist items completed = true (100% tick) |
| RCA_REVIEW | INVESTIGATION checklist reaches 100% | Approval event action = APPROVE for RCA_SIGNOFF (§2.5) |
| CAPA_EXECUTION | RCA is approved | All CAPA checklist items completed = true |
| VERIFICATION | All CAPA tasks closed | Approval event action = APPROVE for CAPA_VERIFICATION (§2.5) |
| RESOLVED (auto) | Verification approved | Immediately transitions to closure review (§14 Activity 7) |

**Engine-Level Guard.** The state machine (§2.2) is enforced server-side. CAPA_EXECUTION cannot begin without an `approval_event` row with `action = APPROVE` and `approval_stage = RCA_SIGNOFF`. Likewise, RESOLVED cannot fire without an `approval_event` row for `CAPA_VERIFICATION = APPROVE`. These checks are at the API layer and verified by an automated test in CI (AC-INV-04, §15).

#### 2.4.2 Audit-Loggable Activity Rule

Every entry into INVESTIGATION triggers a new `case_state_log` event with `metadata_json.event_subtype = "INVESTIGATION_STARTED"`. Every checklist tick is mirrored into `case_state_log` as `metadata_json.event_subtype = "CHECKLIST_PROGRESS"` (§12.1.9). This makes the entire post-triage path visible in the standard case timeline and to standard audit queries.

#### 2.4.3 Investigation Methodology Auditability *(v1.2 NEW — Enhancement)*

To ensure that *how* a Root-Cause Analysis was conducted is just as auditable as *what* the conclusion was, every case that enters INVESTIGATION MUST capture the **Investigation Methodology Used** as a first-class, required, auditable field. The methodology is selected by the Investigation Lead (typically the Resolver) at the moment of first checklist tick and is locked once the case transitions out of INVESTIGATION. Any subsequent change of methodology requires a new `case_state_log` event with `metadata_json.event_subtype = "INVESTIGATION_METHODOLOGY_CHANGED"` and a mandatory rationale comment of length ≥ 10 characters.

| Methodology Code | Methodology Name | When to Use (Indicative) | GrillMe Rationale |
|-----------------|-----------------|--------------------------|-------------------|
| FISHBONE | Fishbone (Ishikawa) Diagram | Multi-cause incidents with cross-functional contributing factors (Man, Machine, Material, Method, Measurement, Environment) | Forces explicit consideration of contributing-factor categories; required by customer-audit playbook for ≥ L3 cases. |
| FIVE_WHYS | 5-Whys | Single-fault, sequential-cause incidents | Lightweight; appropriate for L2/L3 cases where a single root cause is dominant. |
| FAULT_TREE | Fault Tree Analysis (FTA) | High-severity (L1/L2) cases with potential cascading-failure paths | Quantitative; preferred when rule E-8 has fired and the loss exceeds the High-Value CAPA Threshold (configurable; default USD 10,000). |
| TIMELINE | Timeline / Chronological Reconstruction | Sequential incidents where time-ordering is the dominant evidence (e.g., equipment failure sequence) | Required when the incident involves IoT/SCADA telemetry (see §8 offline-telemetry references). |
| CHANGE_ANALYSIS | Change Analysis (Pre-event vs. Post-event delta) | Incidents triggered by a recent change (process, equipment, personnel, material) | Required when the case is opened within 14 days of a documented change-control event. |
| PARETO | Pareto Analysis | Recurring-incident clusters (3+ similar in 7d) | Required for cases linked to a `case_cluster` row (§4.4 mass-incident). |
| OTHER | Other (free-text justification) | Methodology not in the canonical list | Free-text justification of length ≥ 50 characters is mandatory; reviewed weekly by Compliance Officer. |

**Governance Rule (binding).** The `investigation_methodology_used` field is required on every `investigation_checklist_progress` row (§12.1.9) and on the first `approval_event` row of stage `RCA_SIGNOFF` (§12.1.10). Absence of the field is enforced at the API layer (HTTP 422) and at the DB layer (CHECK constraint). The methodology is also surfaced in the Compliance Dashboard as a filterable dimension on the Investigation Aging view.

**Binding Clause — OTHER Rationale Floor.** When `investigation_methodology_used = "OTHER"`, a companion free-text `methodology_rationale` field is mandatory and MUST contain at least 50 characters of substantive justification (no boilerplate, no whitespace padding, no "see above" cross-references). The character count is enforced at the API layer (HTTP 422 `METHODOLOGY_RATIONALE_TOO_SHORT` when length < 50 after trimming) and at the DB layer (`CHECK constraint char_length(trim(methodology_rationale)) >= 50 when investigation_methodology_used = 'OTHER'`). When `investigation_methodology_used` is any value other than `OTHER`, the `methodology_rationale` field is optional. Compliance Officer reviews the count of OTHER selections and the rationale quality weekly (§12.3 GrillMe row).

**Audit-Trail Linkage (binding mirroring).** Every methodology selection — including initial selection, change of methodology, and OTHER rationale capture — is mirrored into `case_state_log` as an auditable activity using the following `metadata_json.event_subtype` taxonomy:

| metadata_json.event_subtype | Trigger | Required metadata_json Fields |
|----------------------------|---------|-------------------------------|
| INVESTIGATION_METHODOLOGY_SET | First selection at first checklist tick of INVESTIGATION | methodology_used, actor_id, methodology_rationale (when OTHER) |
| INVESTIGATION_METHODOLOGY_CHANGED | Subsequent change of methodology while case remains in INVESTIGATION | methodology_used (new), prior_methodology_used, actor_id, change_reason (≥ 10 chars) |
| INVESTIGATION_METHODOLOGY_LOCKED | Case transitions out of INVESTIGATION (entry into RCA_REVIEW) | methodology_used (final), actor_id |

The mirroring is performed by a DB-level trigger on `investigation_checklist_progress` (inserted/updated rows with `item_index = 1` or with `investigation_methodology_used` differing from the prior row) and by a corresponding engine-level hook on the stage-transition guard (§2.2). The mirrored events are queryable through the `vw_investigation_methodology_30d` materialized view (added to §12.2) and are bundled into the Case Audit Trail regulator export (R-AU-01, §11.3) without requiring a separate report.

**GrillMe Rationale.** Without a methodology field, a reviewer cannot distinguish a rigorous 5-Whys analysis from a one-line "root cause: operator error" assertion. Mandating methodology classification forces the Investigation Lead to declare the analytical lens and creates a comparable evidence base across cases — a non-negotiable posture for any compliance audit (BSCI, SA8000, customer-specific).

### 2.5 Approval Governance *(v1.2 NEW)*

The post-triage operational pipeline (§2.4) requires multi-stage approval at three points:

| Approval Stage | Stage Triggered | Approvers | RACI (§14.3) |
|---------------|----------------|-----------|--------------|
| RCA_SIGNOFF | End of RCA_REVIEW | Plant Manager (operational A) + Compliance Officer (review A) | Activity 14 |
| CAPA_VERIFICATION | End of VERIFICATION | Plant Manager (operational A) + Compliance Officer (verification A) | Activity 16 |
| CASE_CLOSURE | End of RESOLVED | Plant Manager + Compliance Officer | Activity 7 (already in v1.1) |

#### 2.5.1 Mandatory Approval Rules

1. **Dual-control.** Each stage requires two approval events from two distinct named individuals, one of whom is the Compliance Officer (for RCA_SIGNOFF and CAPA_VERIFICATION) or the Plant Manager (for CASE_CLOSURE). Same-individual double-approval is rejected at the API layer.

2. **Mandatory rejection comment.** An approval event with `action = REJECT` or `action = REQUEST_CHANGES` must include `comment` of length ≥ 10 characters. Enforced at the API (HTTP 422) and at the DB layer (CHECK constraint on `approval_event`).

3. **AI-summary linkage.** When an approval decision was informed by an AI summary (§9.8), the approving user must include `validated_by_user_id` pointing to the user who validated the AI output before this approval. AI-only decisions are prohibited by default (§9.8).

4. **Audit immutability.** `approval_event` (§12.1.10) is INSERT-only at the DB role level. No UPDATE or DELETE is permitted. Audit-trail integrity is enforced by §12.3 GrillMe rows.

5. **Sequencing.** Approvals must follow the pipeline order: RCA_SIGNOFF cannot fire before INVESTIGATION is complete; CAPA_VERIFICATION cannot fire before CAPA_EXECUTION is complete; CASE_CLOSURE cannot fire before CAPA_VERIFICATION = APPROVE.

#### 2.5.2 Rejection Routing

When an approval is REJECT or REQUEST_CHANGES:

- **RCA_SIGNOFF REJECT** → Case routes back to INVESTIGATION (§2.3 GrillMe row). Compliance Officer reviews the rejection reason and either: (a) reopens with new checklist items, or (b) escalates to Plant Manager for guidance. The fresh RCA must be re-signed-off.

- **CAPA_VERIFICATION REJECT** → Case routes back to CAPA_EXECUTION. If this is the second or later rejection of the same CAPA, rule E-9 fires (§7.3) and the case is flagged **Repeat-Failure CAPA**. After two rejections, a fresh RCA sign-off is required (i.e., the case loops back to INVESTIGATION and a new RCA must be drafted).

- **CASE_CLOSURE REJECT** → Case returns to RESOLVED for re-work. SLA clock is not reset; this is logged as a Repeat-Closure-Rejection event and surfaces in the Reopened Incident Rate KPI (§17.2).

#### 2.5.3 Approval Audit Trail Pattern

`approval_event` follows the `identity_access_audit` pattern (§9.5):

- INSERT-only at DB role level.
- Reviewed quarterly by Compliance Officer.
- Retained for the life of the company + 7 years (per Master PRD).
- Partitioned monthly for query performance.
- Every approval is queryable via `vw_approval_trail_case(case_id)` materialized view (refreshed hourly, added to §12.2 implicitly through the existing derived-views pattern).

#### 2.5.4 GrillMe Hardening — Approval Governance

| Challenge Raised | Resolution |
|-----------------|------------|
| "What if a Plant Manager refuses to co-sign because they disagree with Compliance's RCA review?" | The case is blocked at the engine level until both As sign off. Compliance's review-A and Plant Manager's operational-A are independent; either may reject. The disagreement is documented in `approval_event` rows and is reviewed at the next ExCo. |
| "What if a Compliance Officer attempts to self-approve Activity 16 (verification) AND then Activity 17 (closure sign-off)?" | The SoD check (§14.5 v1.2 GrillMe row) excludes the Activity-16 Compliance Officer from the Activity-17 co-signer slot for the same case. Enforced at the API layer. |
| "What if the rejection comment is 'see attached' with no detail in the comment field itself?" | The DB-layer CHECK constraint requires `comment` of length ≥ 10 characters in the `approval_event` row itself. Attachments may be referenced by URL in `source_artifact_ref` but the comment must stand alone. |
| "What if the network drops mid-approval and the approval event is half-written?" | `approval_event` writes are atomic (NFR-REL-01). A dropped connection results in zero rows committed, and the UI prompts re-submission. The approver's intent is captured client-side and replayable. |
| "What if the AI summary (§9.8) is the only basis for an approval?" | The approval is rejected at the API layer with HTTP 422 and message "AI-only approvals require a `validated_by_user_id`; human validation is mandatory." |

---

## 3. Reporting & Evidence Visibility

### 3.1 What Management Can See (Manual Reports)

For manual (login-based) reports, supervisors and compliance officers have full read access to:

- Reporter identity, role, department, and shift
- All 14 form fields (Section 6 of Epic 1)
- All uploaded media: photos (up to 10), audio memos, videos (up to 30s)
- Voice-to-text transcripts
- Auto-captured metadata: GPS lat/long (±10m), timestamp (server + device), device ID, app version, network type
- Lifecycle events (§2)

### 3.2 What Management Can See (Anonymous Reports)

For anonymous reports, the system must guarantee:

- The reporter's login identity, employee ID, device ID, and IP address are **never stored or displayed** to any user role.
- Only the auto-captured device metadata (model, OS version, app version) is retained for technical triage.
- A legal-access-only escrow exists for the rare case where a court order compels identity disclosure (see §9.4).

### 3.3 What Management Can See (Confidential Reports)

For confidential reports, the reporter is identified in the audit log but visibility is restricted:

- Plant Manager and Compliance Officer can see identity and content.
- Supervisors see content only, with reporter identity masked as "Reporter A".
- Identity unmasking is an audited, role-gated action (§9.5).

### 3.4 Evidence Integrity

| Requirement | Specification |
|-------------|---------------|
| Chain of custody | Every view, download, or share of an evidence artifact is logged with actor, timestamp, and purpose code. |
| Tamper evidence | Evidence artifacts are stored with SHA-256 hash; any access recomputes and logs the hash. |
| Retention | Media retained for case life + 1 year; then archived to cold storage with hash manifest. |
| Export | Compliance Officer can export an evidence package (PDF report + media zip + audit trail) for legal. |
| Watermarking | All exports carry a digital watermark: "CONFIDENTIAL — iFar-Silexa (Pvt.) Ltd. — Case [ID] — Exported by [Name] on [Date]" |

### 3.5 GrillMe Hardening — Evidence Visibility

| Challenge Raised | Resolution |
|-----------------|------------|
| "A malicious supervisor could leak an evidence photo to social media — how is that detected?" | All exports and screen-grab-risky views (e.g., full-resolution photo access) require a purpose code selected from a fixed list and are subject to weekly anomaly review. |
| "What if a 'rejected' report was actually valid, and we destroyed the evidence?" | Rejected reports are archived, not deleted, with the rejection reason logged. They can be reopened on appeal. |
| "Can a reporter delete a photo after submission, claiming they didn't upload it?" | No. Post-submission, only appending evidence is permitted; existing artifacts cannot be removed. |
| "What if the GPS reading is clearly wrong (e.g., another city)?" | The system flags GPS plausibility (within N km of plant geofence); flag does not block submission but is visible to the triager. |
| "Can a manager see the reporter's other reports, enabling retaliation patterns?" | No. Cross-incident visibility of a single reporter is restricted to Compliance Officer only, and is itself logged. |

---

## 4. Response Time & Delay Tracking

### 4.1 Clock Definitions

| Clock | Starts | Stops | Resets? |
|-------|--------|-------|---------|
| Triage Clock | SUBMITTED | TRIAGED | No |
| Assignment Clock | TRIAGED | ASSIGNED | No |
| Resolution Clock | ASSIGNED | RESOLVED | Yes, only on legitimate state change (e.g., re-assignment adds 50% of remaining time, never extends beyond original SLA) |
| Idle Clock | Any state where no event is logged for X hours | Next state transition | Resets on any logged activity |
| End-to-End Clock | SUBMITTED | CLOSED | No — single source of truth for cycle time |

### 4.2 Standard SLA Targets (Defaults)

| Severity | Triage SLA | Assignment SLA | Resolution SLA |
|----------|-----------|----------------|----------------|
| L1 — Critical / Life-Safety | ≤ 15 min | ≤ 30 min | ≤ 4 hours |
| L2 — Significant / Operational | ≤ 1 hour | ≤ 4 hours | ≤ 24 hours |
| L3 — Minor / Quality | ≤ 4 hours | ≤ 24 hours | ≤ 72 hours |
| L4 — Observation / Suggestion / Process improvement | ≤ 24 hours | ≤ 48 hours | ≤ 14 days |

These targets are configurable per §7.

### 4.3 Unassigned & Idle Handling

- If a report remains in SUBMITTED with no triage action for 2 hours, it is auto-flagged `UNASSIGNED_URGENT` and pushed to the Plant Manager's dashboard.
- If ASSIGNED with no logged activity for 25% of the resolution SLA (e.g., 6 hours for an L2 with 24h SLA), the owner receives a nudge; if 50% is reached, their supervisor is cc'd.
- If PENDING_EVIDENCE exceeds 7 calendar days, Plant Manager is notified.
- *(v1.2 NEW)* If a case sits in INVESTIGATION with no checklist progress logged for 25% of the Investigation SLA (§4.5), the Investigation Lead is nudged and rule E-7 is armed (§7.3). If the 50% threshold is reached, the Plant Manager is cc'd. If the 100% threshold is reached without the checklist reaching 100%, rule E-7 fires (§7.3).
- *(v1.2 NEW)* If CAPA_EXECUTION exceeds the CAPA SLA (§4.5), rule E-9 fires (§7.3) and the case is flagged as **Overdue CAPA** on the Compliance Dashboard.

### 4.4 GrillMe Hardening — Time Tracking

| Challenge Raised | Resolution |
|-----------------|------------|
| "What if the server clock drifts relative to the device clock?" | All SLA times are computed from server timestamps at state transition; device time is stored but never authoritative. |
| "What if a report is filed at 23:55 and SLA starts immediately across the night shift?" | An operational-hours-aware SLA mode is supported: e.g., resolution SLA pauses during plant shutdown windows. Configurable per §7. |
| "What about mass-incident events (e.g., a chemical leak) generating 50 L1 reports at once?" | A mass-incident clustering rule groups related reports (same GPS, same time window) under a parent incident; SLA is measured on the parent. |
| "Could a supervisor 'pause' their own clock by repeatedly moving the report to PENDING_EVIDENCE?" | Yes — mitigated by the 7-day cap and by tracking PENDING_EVIDENCE frequency per owner (§5.4). |
| "What if the SLA is missed by 1 minute due to a network blip?" | A 5-minute grace window is applied to non-L1 severities; L1 has no grace. |
| "What about partial offline sync (§8)?" | A report that took 3 hours to sync still has its SUBMITTED time recorded as the original device timestamp so reporters are not penalized for offline resilience. |

### 4.5 Investigation & CAPA SLAs *(v1.2 NEW)*

This section defines the post-triage operational SLAs for the lifecycle stages added in §2.4. These SLAs are additive to the v1.1 SLAs in §4.2; they do not modify L1–L4 triage/assignment/resolution targets.

#### 4.5.1 Default SLA Targets (v1.2 Post-Triage Stages)

| Stage | Default SLA | Clock Start | Clock Stop | Breach Rule |
|-------|------------|-------------|------------|-------------|
| INVESTIGATION | 24h | Entry into INVESTIGATION | 100% checklist completion | E-7 (§7.3) |
| RCA_REVIEW | 72h total | Entry into RCA_REVIEW | approval_event APPROVE for RCA_SIGNOFF | E-7 (§7.3) |
| CAPA_EXECUTION | 72h | Entry into CAPA_EXECUTION | 100% CAPA checklist completion | E-9 (§7.3) |
| VERIFICATION | 48h | Entry into VERIFICATION | approval_event APPROVE for CAPA_VERIFICATION | E-9 (§7.3) |

> All SLAs are configurable per §7 (sla_configuration table). The values above are system defaults seeded at deployment.

---

*[Sections 5–27 continue in the full specification document]*
