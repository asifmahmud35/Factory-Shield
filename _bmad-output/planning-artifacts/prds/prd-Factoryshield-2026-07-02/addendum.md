---
title: 'FactoryShield PRD — Addendum'
updated: '2026-07-02'
---

# Addendum

Implementation-level and technical-how detail extracted out of `prd.md` during distillation — belongs to architecture/solution-design, not to the PRD's capability narrative.

## Data Model Notes (source: `docs/PRD.md` §6-10 field summaries)

- **Severity** stored as `SMALLINT 1–4`; all labels (Critical/High/Medium/Low) are presentation projections, never stored as strings.
- **Incident key fields:** `incident_id`, `incident_reference`, `severity`, `category`, `status`, `created_by_user_id`, `created_at`, `local_event_time`, `display_status` (Reporter-facing projection).
- **Investigation fields:** `checklist_items[]` (8 fixed items), `checklist_completion_pct`, `investigation_status`, `owner`, `investigation_date`, `target_completion`.
- **Timeline events:** `investigation_timeline_event_id`, `event_type`, `description`, `created_by`, `created_at`, `attachment_id` (nullable) — append-only, no edit/delete path.
- **Root cause fields:** `root_cause_code`, `methodology_used` (5-Why / Fishbone / Fault Tree), `methodology_rationale`, `findings_summary`, `immediate_action_taken`, `lessons_learned`.
- **CAPA fields:** `corrective_action_id`, `incident_id`, `description`, `owner`, `target_date`, `priority`, `completion_pct`, `verified_at`, `verified_by`.
- **Approval events:** `approval_event_id`, `incident_id`, `approval_type`, `actor_id`, `actor_role`, `decision` (APPROVE/REJECT), `submitted_at`, `rejection_reason`. DB-level `REVOKE UPDATE, DELETE` for the application role — immutability enforced at the database, not just the application layer.
- **Incident state log:** `incident_state_log_id`, `event_type`, `actor_id`, `actor_role`, `description`, `previous_value`, `new_value`, `visibility_scope` (PUBLIC / INTERNAL / RESTRICTED).

## State Machine (mechanism/transport decision)

- Core flow: `SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`, plus `REJECTED`, `PENDING_REPORTER_INPUT`, `MERGED_CLOSED`.
- Governance gates insert between `IN_PROGRESS`/`RESOLVED` for L3/L4 severity only: `INVESTIGATION → RCA_REVIEW → CAPA_EXECUTION → VERIFICATION`.
- Exactly one code path may write `Incident.Status` — an injected state-machine interface enforces a legal-transition adjacency map; direct assignment elsewhere is prohibited. (Architecture concern, not a PRD capability — kept here per PRD Discipline.)

## Governance Gate Table (mechanism detail behind FR-28/29/30)

| Gate | Fires at | Approvers required |
|---|---|---|
| `CLOSE_INVESTIGATION` | Investigation checklist 100% complete | Resolver + Manager |
| `ROOT_CAUSE_SIGN_OFF` | RCA submitted | Manager + Safety/Compliance Officer |
| `CAPA_VERIFICATION` | All CAPA tasks verified | Resolver + Manager |
| `RESOLUTION_FINAL` | RESOLVED → CLOSED | Manager + Plant Manager |

Separation of Duties (SoD): the same actor cannot approve two consecutive gates on the same incident; the restriction resets after two consecutive gates separate the actor from a repeat vote.

## Rejected/Deferred Alternatives

- **Department as FK vs string:** a full `departments` table was considered but deferred — MVP has no department-management UI, so a FK would require seeding data that doesn't exist yet. Kept as a documented deviation rather than building unused scaffolding.
- **Notification delivery:** real push/email (FR-36) was scoped out of the initial phase in favor of in-app-only, to avoid taking a dependency on an email/SMS provider before the core workflow was proven.

## Sizing / Velocity Data

- Velocity baseline from Sprints 0–2: ~18 points/sprint (Fibonacci sizing), used as the capacity ceiling for subsequent sprint planning (see `docs/SPRINT_PLANNING.md`).
