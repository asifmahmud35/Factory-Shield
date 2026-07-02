# FactoryShield — Epic 2: Reviewing and Approving an Incident

**Approver Workflow Specification**

> Builds on: Epic 1 — Reporting an Incident
> Document status: Draft — incorporates UX research review and gap analysis

---

## Table of Contents

1. [Persona: Approver](#persona-approver)
2. [Epic User Journey](#epic-user-journey)
3. [User Stories](#user-stories)
   - [US-1: View and Filter the Review Queue](#us-1-view-and-filter-the-review-queue-mobile--desktop)
   - [US-2: Claim an Incident Before Acting On It](#us-2-claim-an-incident-before-acting-on-it)
   - [US-3: Review Incident Details and Evidence](#us-3-review-incident-details-and-evidence)
   - [US-4: Approve an Incident and Hand It Off Clearly](#us-4-approve-an-incident-and-hand-it-off-clearly)
   - [US-5: Reject an Incident — Soft or Hard](#us-5-reject-an-incident--soft-disputable-or-hard-final)
   - [US-6: Reassign Category or Severity](#us-6-reassign-category-or-severity-with-loop-protection)
   - [US-7: Escalate an Incident](#us-7-escalate-an-incident--manual-or-sla-based-with-staged-warnings)
   - [US-8: Merge Duplicate Incidents](#us-8-merge-duplicate-incidents)
   - [US-9: Request More Information from Reporter](#us-9-request-more-information-from-reporter)
   - [US-10: Notifications Without Fatigue](#us-10-notifications-without-fatigue)
   - [US-11: Audit Trail of Approver Decisions](#us-11-audit-trail-of-approver-decisions)
4. [Epic 2 Field Summary](#epic-2-field-summary)
5. [Source Traceability](#source-traceability)

---

## Persona: Approver

Factory user who reviews incidents submitted by Reporters, validates their accuracy and classification, and moves them toward resolution by **Approving**, **Rejecting**, **Reassigning**, **Escalating**, **Merging**, or **Requesting clarification**.

Level 1 is the Supervisor by default. Higher levels — such as a Safety or Compliance Officer, or other configured roles — are determined by the factory's backend workflow configuration, based on severity, category, or escalation chain rules.

### Needs

- A single, mobile-and-desktop-friendly Review Queue showing only incidents routed to their level/role, sorted by urgency.
- Ability to explicitly **claim/acknowledge** an incident before deciding on it, so two Approvers never work the same incident blind to each other.
- Full visibility into Reporter-submitted details and evidence, with confidentiality protections preserved.
- A clear, low-ambiguity decision set: **Approve** (with assignment), **Reject** (soft or hard), **Reassign** category/severity, **Escalate** (manual or automatic), **Merge** duplicate, **Request more info**.
- SLA visibility with **early warnings** — not just breach notifications — so action happens before escalation becomes necessary.
- Protection against **routing loops** when categories or severities are reassigned across levels.
- A complete, immutable **audit trail** of every decision for compliance.

> This epic builds directly on Epic 1's incident creation output and consolidates Approver-side requirements from the Group-7, Group-6, Group-3, and Group-5 PRDs, refined against current incident-management and approval-workflow UX practice — including staged SLA-warning patterns, claim/acknowledge ownership patterns, and handoff-context preservation.

---

## Epic User Journey

1. Approver opens FactoryShield (mobile or desktop/tablet) and lands on their **Review Queue** — only incidents routed to their current level/role appear.
2. Queue is sorted by default: **SLA-nearing-breach first**, then High severity, then age.
3. Approver **claims** an incident (explicit action) before working on it. Claimed incidents are visibly locked to that Approver, preventing duplicate work by another Approver at the same level.
4. Approver opens the claimed incident: full Reporter-submitted details, evidence, factory context, and an **SLA countdown** with a clear stage — `Healthy`, `Warning`, or `Critical`. Confidentiality rules from Epic 1 apply: protected identity stays hidden unless the Approver holds an authorized confidentiality role, and that view is logged.
5. Approver decides between **six outcomes**:
   - **Approve** — status becomes `Approved`. The Approver assigns a Resolver directly, or the system auto-routes per a configured rule. A structured handoff note travels with the assignment.
   - **Reject (Soft)** — reason required; Reporter is notified; a dispute window opens per Epic 1 US-7.
   - **Reject (Hard / Confirmed False or Malicious)** — reason and category required; no dispute window opens; the case is flagged for Compliance/Admin visibility.
   - **Reassign category/severity** — original values are preserved in the timeline; if the new classification maps to a different level, the incident re-routes; a loop-guard prevents the same incident bouncing between two levels more than once without an Admin/Compliance tiebreak.
   - **Escalate** — manual (any time, e.g. an emergency) or automatic (SLA breach with no claim or decision). Full context and timeline travel with the escalation, so the next Approver does not start from zero.
   - **Merge Duplicate** — linked to a primary incident; evidence is retained; the Reporter sees a merged status.
   - **Request More Info** — status becomes `Pending Reporter Input`; SLA pauses by default (configurable); resumes on Reporter response or reverts to the Approver per timeout policy.
6. SLA warnings fire at configured thresholds (for example 50% and 80%) **before** breach — the Approver is nudged in advance, not just notified after the fact.
7. Every action — claim, decide, escalate, reassign, merge, request-info — is timestamped, attributed, and stored **immutably** on the incident timeline.
8. Once the incident reaches a terminal state (`Approved and Assigned`, `Rejected-Final`, or `Merged-Closed`), Epic 1's Reporter-facing status view updates accordingly.

---

## User Stories

### US-1: View and Filter the Review Queue (Mobile + Desktop)

> As an Approver, I want to see only incidents routed to my level/role, sorted by urgency, on whichever device I am using, so that I can act on the most critical items first without digging through unrelated reports.

#### Acceptance Criteria

- **Given** I open my Review Queue on mobile or desktop/tablet, **when** incidents exist at my configured approval level, **then** I see only those incidents — the layout adapts to screen size but shows identical data and actions.
- **Given** multiple incidents are in my queue, **then** they are sorted by default: SLA stage (`Critical → Warning → Healthy`), then severity, then age.
- **Given** I apply a filter (severity, category, location, age, status, claimed/unclaimed), **then** the queue updates to match.
- **Given** an incident is confidential/anonymous and I lack the authorized confidentiality role, **then** identity/contact fields are hidden in both the queue and the detail view.
- **Given** an incident is already claimed by another Approver at my level, **then** I see it marked `"Claimed by [name/role]"` and cannot claim it myself unless they release it or it times out unclaimed.
- **Given** an incident has escalated past my level, **then** it disappears from my queue automatically.

#### Fields

| Field | Description |
|---|---|
| `approver_user_id`, `approver_role`, `approval_level` | Identifies the Approver and their current configured level/role. |
| `device_type` | Mobile or desktop/tablet — used for layout adaptation only, not for hiding functionality. |
| `queue_filter_severity` / `category` / `location` / `age` / `status` / `claim_state` | Filter parameters applied to the queue view. |
| `incident_id`, `severity`, `category`, `status` | Core incident identifiers shown in the queue. |
| `sla_stage` (Healthy / Warning / Critical / Breached), `sla_remaining` | Drives default sort order and visual flagging. |
| `routed_to_level`, `routed_to_role` | Determines which Approver's queue the incident currently belongs to. |
| `claimed_by`, `claimed_at`, `claim_released_at` | Tracks current ownership state of the incident. |
| `confidentiality_visibility_flag` | Controls whether identity/contact fields render for this Approver. |

---

### US-2: Claim an Incident Before Acting On It

> As an Approver, I want to explicitly claim an incident before reviewing or deciding on it, so that two Approvers at the same level never duplicate work or give conflicting decisions on the same incident.

#### Acceptance Criteria

- **Given** an unclaimed incident is in my queue, **when** I open it, **then** I am prompted to claim it before any decision action becomes available.
- **Given** I claim an incident, **then** it is locked to me and hidden from other same-level Approvers' actionable list (they may still view it read-only if permitted).
- **Given** I claim an incident but take no action within a configured claim-timeout, **then** the claim auto-releases and the incident becomes claimable again, with the lapsed claim logged.
- **Given** I manually release a claim (for example, I realize I am not the right person), **then** the incident returns to the shared queue immediately, unclaimed.
- **Given** an incident auto-escalates due to SLA breach while claimed, **then** the claim is cleared and the next-level Approver receives a fresh, unclaimed incident with full context attached.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `claimed_by`, `claimed_at` | Identifies who currently owns the incident and since when. |
| `claim_timeout_minutes`, `claim_auto_released` (boolean) | Configurable window before an inactive claim is released automatically. |
| `claim_released_by`, `claim_released_at`, `claim_release_reason` | Captures manual releases distinct from auto-releases. |
| `claim_history_log` | Chronological record of every claim and release event for this incident. |

---

### US-3: Review Incident Details and Evidence

> As an Approver, I want to view full incident details, evidence, and context, so that I can make an informed decision without needing to contact the Reporter directly.

#### Acceptance Criteria

- **Given** I open a claimed incident, **then** I see category, severity, location/machine context, description, timestamps, source channel, and all linked evidence (photo, voice note, document), each showing its upload/sync status.
- **Given** the incident is confidential/anonymous and I lack the authorized role, **then** identity/contact stays hidden, and my access attempt is still logged for audit transparency.
- **Given** I am an authorized confidentiality role viewing protected data, **then** that access is logged with my ID, timestamp, reason, and incident ID (per Epic 1 US-5).
- **Given** the incident has prior timeline updates (supplemental evidence, clarifications, previous escalation notes), **then** I see them in chronological order, clearly separated from the original submission.
- **Given** I am viewing on mobile, **then** evidence — photos especially — remains fully viewable and zoomable without needing a desktop.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `attachment_list`, `attachment_status` | The incident and its linked evidence with current upload/sync state. |
| `description`, `category`, `severity`, `location_text`, `machine_id` | Core Reporter-submitted context. |
| `timeline_events` (typed: submission, evidence, escalation_note, decision) | Ordered history of everything that has happened to the incident. |
| `identity_view_audit_log_id` | Logs any access to protected identity/contact data. |
| `reporter_visibility`, `protected_reporter_contact` | Conditionally visible fields, governed by confidentiality rules. |

---

### US-4: Approve an Incident and Hand It Off Clearly

> As an Approver, I want to approve a valid incident and hand it off with clear context, so that the Resolver can start work immediately without needing to re-investigate.

#### Acceptance Criteria

- **Given** a claimed incident is valid and within my authority, **when** I select Approve, **then** status changes to `Approved`, timestamped and attributed to me.
- **Given** factory configuration allows manual assignment at my level, **when** I approve, **then** I can directly select a Resolver and add a handoff note (what is confirmed, urgency, any access/safety instructions).
- **Given** factory configuration defines automatic routing rules, **when** I approve without manually assigning, **then** the system auto-assigns per the rule and still carries forward the full incident context — never a blank-slate handoff.
- **Given** the incident's category/severity requires a higher approval level per configuration, **when** I approve, **then** it routes to that level instead of going to a Resolver — even if I attempt direct assignment, the system blocks it and explains why.
- **Given** I approve an incident, **then** the Reporter's status view updates (per Epic 1 US-7), and my claim on the incident is released since the decision is complete.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `decision: Approve` | Records the decision type. |
| `decided_by`, `decided_at` | Attribution and timestamp for the decision. |
| `assignment_mode` | manual, auto_routed |
| `assigned_resolver_id`, `handoff_note` | Who receives the incident, and the context that travels with it. |
| `routing_rule_id`, `next_level_required` (boolean), `block_reason` | Governs auto-routing and explains any blocked manual assignment. |
| `approval_level_completed` | Marks which level's review is now finished. |

---

### US-5: Reject an Incident — Soft (Disputable) or Hard (Final)

> As an Approver, I want to reject invalid or duplicate incidents, and clearly separate ordinary mistaken reports from confirmed false or malicious ones, so that genuine reporters retain a fair right to clarify, while abuse is shut down cleanly.

#### Acceptance Criteria

- **Given** I select Reject, **then** I must choose a reject type — **Soft** (for example, insufficient detail, miscategorized, not actionable) or **Hard** (Confirmed False/Malicious Report) — and provide a reason.
- **Given** I select Soft Reject, **then** status becomes `Rejected`, the Reporter sees the reason in their status view, and a dispute window opens per Epic 1 US-7.
- **Given** I select Hard Reject, **then** status becomes `Rejected-Final`, no dispute window opens, and the case is flagged for Compliance/Admin visibility (for example, for repeat-offender or trust-score handling, if factory policy uses one).
- **Given** a Soft-Rejected incident is disputed within the window, **then** it reopens to my queue (or the configured review level) marked `"Disputed"`, unclaimed, for fresh review.
- **Given** the dispute window passes with no response, **then** the Soft Reject becomes final and locked, the same as a Hard Reject.
- **Given** I reject an incident, either type, **then** my claim on it is released and the decision is timestamped and attributed to me.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `decision: Reject` | Records the decision type. |
| `reject_type` | Soft, Hard_Confirmed_False |
| `rejection_reason`, `decided_by`, `decided_at` | Reason and attribution for the rejection. |
| `dispute_status` | None, Disputed, Dispute_Expired, Not_Applicable |
| `dispute_window_until` | Deadline by which the Reporter may dispute a Soft Reject. |
| `reopened_from_rejection` (boolean) | Flags incidents that returned to the queue via a dispute. |
| `compliance_flagged` (boolean), `repeat_offender_flag` | Optional, policy-driven flags raised on Hard rejects. |

---

### US-6: Reassign Category or Severity (with Loop Protection)

> As an Approver, I want to correct a misclassified incident's category or severity, so that it follows the right workflow and reaches the right people, without bouncing endlessly between levels.

#### Acceptance Criteria

- **Given** I change category or severity, **then** the system records the original and updated values, the reason, and who/when decided it — the original values remain visible in the timeline.
- **Given** the new classification maps to a different configured approval level, **then** the incident re-routes to that level, my claim is released, and full context/history travels with it.
- **Given** the new classification maps to my own level, **then** I keep the incident in my queue and may continue with Approve, Reject, or Escalate.
- **Given** an incident has already been re-routed once due to reclassification, **when** it would be reclassified back to a level it already passed through, **then** the system blocks the automatic re-route and instead flags it for an Admin/Compliance tiebreak decision rather than bouncing it again.
- **Given** the loop-guard triggers, **then** both the sending and receiving Approvers are notified that the incident is paused pending a tiebreak.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `original_category`, `original_severity` | The incident and its classification as originally submitted or last set. |
| `updated_category`, `updated_severity` | The new classification chosen by the Approver. |
| `reclassification_reason`, `decided_by`, `decided_at` | Justification and attribution for the change. |
| `re_routed` (boolean), `new_routed_level` | Whether the change triggered a level change, and to which level. |
| `reroute_count`, `loop_guard_triggered` (boolean), `tiebreak_pending` (boolean) | Tracks how many times the incident has moved between levels, and whether the loop-guard has intervened. |

---

### US-7: Escalate an Incident — Manual or SLA-Based, With Staged Warnings

> As an Approver, I want advance warning before SLA breach, plus the ability to escalate urgent cases immediately myself, so that critical issues never silently wait on one person, and I am not caught off guard by auto-escalation.

#### Acceptance Criteria

- **Given** an incident's SLA timer reaches a configured warning threshold (for example, 50%), **then** I receive a non-urgent notification that time is running.
- **Given** the SLA timer reaches a second, higher threshold (for example, 80%), **then** I receive an urgent notification, and the incident visually flags as `"Critical"` in my queue.
- **Given** the SLA window fully elapses with no claim or decision, **then** the system auto-escalates the incident to the next configured level/role, carrying full context, and logs `"SLA breached, auto-escalated"` neutrally rather than as blame.
- **Given** an incident is urgent regardless of remaining SLA time, **when** I select Escalate manually, **then** it moves immediately to the next configured level/role with my note attached, and that Approver is notified.
- **Given** there is no further configured level above the current one, **then** the system flags `"Escalation Exhausted"` and notifies a configured fallback role (for example, a factory admin) rather than leaving it stuck.
- **Given** an incident escalates, manually or automatically, **then** it is removed from the originating Approver's active/claimed queue and appears unclaimed in the next level's queue.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `escalation_type` | Manual, SLA_Auto |
| `sla_warning_threshold_pct`, `sla_critical_threshold_pct`, `sla_stage` | Configurable thresholds and the incident's current stage relative to them. |
| `escalated_from_level`, `escalated_to_level` | The levels involved in the escalation. |
| `escalated_by` (null if auto), `escalated_at`, `escalation_note` | Who triggered a manual escalation, when, and any accompanying note. |
| `sla_deadline`, `sla_breached` (boolean) | The configured deadline and whether it was missed. |
| `escalation_exhausted` (boolean), `fallback_notified_role` | Flags when no further level exists, and who is notified instead. |

---

### US-8: Merge Duplicate Incidents

> As an Approver, I want to merge a duplicate incident into an existing one, so that Resolvers are not working the same issue twice and reporting data stays clean.

#### Acceptance Criteria

- **Given** I identify a duplicate, **when** I select Merge Duplicate, **then** I must search for and select the primary incident it merges into.
- **Given** the merge is confirmed, **then** the duplicate's status becomes `Merged-Closed` with a reference link to the primary incident, and my claim is released.
- **Given** the duplicate has its own evidence, **then** it is retained and linked under the primary incident's timeline — never deleted.
- **Given** the duplicate's Reporter checks status, **then** they see that it was merged, with a reference to the primary incident's permitted-visibility status.
- **Given** an incident is already merged, **then** it cannot be reopened, re-approved, or re-rejected independently — any further action must happen on the primary incident.

#### Fields

| Field | Description |
|---|---|
| `incident_id` (duplicate), `primary_incident_id` | Links the duplicate to the incident it was merged into. |
| `merge_reason`, `merged_by`, `merged_at` | Justification and attribution for the merge. |
| `merged_attachments_carried_over` (boolean) | Confirms evidence from the duplicate was preserved. |
| `duplicate_status: Merged_Closed` | Terminal status for the duplicate incident. |

---

### US-9: Request More Information from Reporter

> As an Approver, I want to request clarification without rejecting outright, so that I have enough information to decide correctly, without losing the incident from view while I wait.

#### Acceptance Criteria

- **Given** details are insufficient, **when** I select Request More Info, **then** I must provide a specific question or request, and status changes to `"Pending Reporter Input"`.
- **Given** the incident is `Pending Reporter Input`, **then** SLA pauses by default, or per the factory's configured policy if they choose not to pause it.
- **Given** the Reporter responds (via Epic 1's follow-up evidence flow), **then** the incident returns to my queue, unclaimed if my claim was released during the wait, and SLA resumes.
- **Given** the Reporter does not respond within a configured timeout, **then** the system either auto-escalates or returns the incident to me flagged `"No Response"`, per factory configuration.
- **Given** the incident is confidential/anonymous, **then** my request routes through the permitted reference-token/follow-up channel without exposing protected identity.

#### Fields

| Field | Description |
|---|---|
| `incident_id`, `info_request_note`, `requested_by`, `requested_at` | The specific clarification requested, and who asked for it. |
| `status: Pending_Reporter_Input` | Interim status while awaiting the Reporter's response. |
| `sla_paused` (boolean), `sla_resume_at` | Whether and when the SLA clock pauses and resumes. |
| `reporter_response_received_at` | Timestamp of the Reporter's reply, if any. |
| `no_response_timeout_action` | auto_escalate, flag_no_response |

---

### US-10: Notifications Without Fatigue

> As an Approver, I want notifications that are timely but not overwhelming, so that I respond to what matters without tuning everything out.

#### Acceptance Criteria

- **Given** a High-severity incident enters my queue, **then** I get an immediate, distinct notification.
- **Given** multiple Low/Medium incidents enter my queue within a short window, **then** the system batches them into a single digest notification rather than firing one per incident.
- **Given** an SLA warning threshold is reached, **then** I get exactly one notification per threshold per incident, not repeated reminders every few minutes.
- **Given** I have already claimed and am actively viewing an incident, **then** I do not receive duplicate notifications about it.
- **Given** I mark a notification as read/acknowledged, **then** it does not reappear in my unread count.

#### Fields

| Field | Description |
|---|---|
| `notification_id`, `incident_id`, `notification_type` | Type values: immediate, digest, sla_warning, sla_critical, escalation, mention. |
| `batched` (boolean), `batch_window_minutes` | Controls whether and how low-priority notifications are grouped. |
| `delivered_at`, `read_at` | Delivery and acknowledgment timestamps. |
| `notification_channel` | Push, in-app, SMS, or email, depending on configuration. |

---

### US-11: Audit Trail of Approver Decisions

> As a Compliance/Admin stakeholder, I want every Approver action permanently logged, so that the review process is auditable end-to-end.

#### Acceptance Criteria

- **Given** any Approver action occurs — claim, release, Approve, Reject, Reassign, Escalate, Merge, Request Info — **then** it is recorded immutably with actor, role, timestamp, incident ID, and reason where applicable.
- **Given** an incident moves across multiple approval levels, **then** the full ordered chain of actions is visible on its timeline, including claims and releases.
- **Given** a confidential/anonymous incident's protected data was viewed, **then** that access is included in the same audit trail (per Epic 1 US-5).
- **Given** a loop-guard or escalation-exhausted event occurs, **then** it is logged with enough detail to reconstruct why the system paused or flagged the incident.
- **Given** an audit log entry is created, **then** it cannot be edited or deleted by any role, including Approvers and Admins.

#### Fields

| Field | Description |
|---|---|
| `audit_log_id`, `incident_id`, `actor_id`, `actor_role` | Identifies the log entry, the incident, and who acted. |
| `action_type`, `action_reason`, `action_timestamp` | What happened, why, and when. |
| `approval_level_at_action` | Which level the incident was at when the action occurred. |
| `previous_value`, `new_value` | Captures before/after state for reclassification or escalation changes. |
| `immutable_flag` (always true) | Confirms the entry cannot be altered or removed. |

---

## Epic 2 Field Summary

The field groups below guide Approver Epic UI, API, and data-model design.

| Group | Fields |
|---|---|
| **Queue / Routing** | `approver_role`, `approval_level`, `routed_to_level`, `sla_stage`, queue filters, `device_type` |
| **Claim / Ownership** | `claimed_by`, `claimed_at`, `claim_timeout`, `claim_auto_released`, `claim_history_log` |
| **Decisions** | decision type, `decided_by/at`, `reject_type` (Soft/Hard), reason fields |
| **Assignment / Handoff** | `assignment_mode`, `assigned_resolver_id`, `handoff_note`, `routing_rule_id` |
| **SLA / Escalation** | `sla_warning/critical_threshold`, `sla_breached`, `escalation_type`, `escalation_exhausted`, `fallback_notified_role` |
| **Reclassification + Loop Guard** | original/updated category & severity, `reroute_count`, `loop_guard_triggered`, `tiebreak_pending` |
| **Duplicate Handling** | `primary_incident_id`, `merged_attachments_carried_over`, `duplicate_status` |
| **Reporter Loop-back** | `dispute_status`, `dispute_window_until`, `info_request_note`, `sla_paused` |
| **Notifications** | `notification_type`, `batched`, `batch_window_minutes` |
| **Confidentiality** | `identity_view_audit_log_id`, `reporter_visibility` (inherited, enforced at Approver level) |
| **Audit** | `audit_log_id`, `immutable_flag`, `previous_value/new_value`, `action_timestamp` |

---

## Source Traceability

| Source | Coverage |
|---|---|
| **Epic 1 (Reporter)** | Builds directly on outputs: `incident_id`, severity, category, evidence, confidentiality flags, and the Reporter-facing status view (US-7) as the contract this epic must update correctly. |
| **Group-7, Group-6, Group-3, Group-5 PRDs** | Supervisor/safety classification review, escalation chain, audit integrity, and compliance-sensitive identity handling — extended here into a configurable multi-level approval workflow with Supervisor as the first level, configuration-driven escalation, SLA-based plus manual escalation, merge and request-info actions, and approve-with-assignment in scope. |