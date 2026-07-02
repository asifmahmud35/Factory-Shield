# BMAD in Practice: A FactoryShield Case Study

## How a Multi-Agent AI Methodology Tamed a Complex Factory Safety System

---

## What is BMAD?

BMAD (Business, Manager, Architect, Developer) is a structured multi-agent AI development methodology where specialized AI agents — each with a distinct role, persona, and toolset — collaborate across the full software development lifecycle. Instead of asking a single AI to "build me an app," BMAD assigns discrete responsibilities to discrete agents:

| Agent | Persona | Responsibility |
|---|---|---|
| **Analyst (Mary)** | Strategic business analyst | Elicit real requirements, expose conflicts, define success |
| **Architect (Winston)** | System architect | Design the technical spine — data models, API contracts, state machines |
| **PM (John)** | Product manager | Write the PRD, slice epics, sequence stories |
| **Dev (Amelia)** | Senior software engineer | Implement story by story, follow the architecture |
| **Tech Writer / QA (Paige)** | Documentation & quality | Validate acceptance criteria, capture lessons learned |

The key insight behind BMAD is that **conflation of roles produces conflicting decisions**. When one AI (or one person) tries to simultaneously be the business analyst, the architect, and the developer, shortcuts accumulate. The analyst who is also the developer will unconsciously scope requirements to what is easy to build. The architect who is also the PM will gold-plate features that don't yet exist in the PRD. BMAD forces these roles apart — each agent hands a concrete artifact to the next, and the next agent is free to push back.

---

## The FactoryShield Problem: Conflicting PRDs and Scope Creep

FactoryShield is a real-time factory safety incident management platform built for garment manufacturing facilities. Workers report injuries, near-misses, and equipment faults. Approvers triage and assign incidents to Resolvers. Investigators conduct root cause analysis. The system must comply with local labor regulations and generate audit-ready reports.

When the project began, three separate product documents existed:

1. **Epic 1 (Reporter Flow)** — focused on the factory floor worker: a fast, mobile-friendly incident report form with photo upload. Defined severity as a dropdown (Critical / High / Medium / Low).

2. **Epic 2 (Approver Workflow)** — focused on the safety manager: a queue view sorted by severity and SLA. Defined severity as an integer (1–4) for sort ordering.

3. **The Monitoring & Governance Spec** — focused on compliance: a 16-state incident lifecycle (DRAFT → SUBMITTED_LOCAL → APPROVED → INVESTIGATION → RCA_REVIEW → CAPA_EXECUTION → VERIFICATION → CLOSED) with strict role gates at each transition.

**The conflicts were immediate:**

- Epic 1 said severity is a display label. Epic 2 needed it as a sortable integer. The database schema couldn't satisfy both without a translation layer that neither document acknowledged.
- Epic 1 assumed a 3-role system (Reporter, Approver, Admin). The Governance Spec required 6 roles (Reporter, Approver, Resolver, Investigator, RCA Reviewer, Compliance Officer).
- The Governance Spec's 16-state machine would make Epic 1's simple form technically impossible to ship without implementing the entire governance pipeline first.

Without a structured methodology, a single developer reading all three documents simultaneously would either (a) build everything at once and ship nothing, or (b) pick one document and silently ignore the others, creating integration debt that surfaces at the worst moment.

BMAD resolved this by forcing the conflict into the open **before a single line of code was written**.

---

## Phase 1: Analyst (Mary) — Surfacing the Real Problem

The Analyst agent's first task was not to define requirements — it was to **identify what was actually in conflict**.

Mary read all three documents and produced a conflict matrix:

- **Severity representation:** Resolved by using `int Severity` as the canonical field (1 = CRITICAL, 2 = HIGH, 3 = MEDIUM, 4 = LOW) with display mapping handled in a `DisplayStatusMapper` utility. Epic 1 gets its labels; Epic 2 gets its sort key. One field, one source of truth.

- **Role count:** Resolved by implementing a 3-role MVP (Reporter, Approver, Resolver) and explicitly deferring Investigator, RCA Reviewer, and Compliance Officer to post-launch. This decision was documented in `architecture.md §4.2` with a "deviation documented" comment — so future developers know it was intentional, not forgotten.

- **State machine scope:** Resolved by defining a 7-state MVP subset (Submitted → Triaged → Assigned → InProgress → Resolved → Closed / Rejected) that maps cleanly onto the 16-state governance model without requiring the full pipeline. The full machine is documented in `IncidentStatus.cs` with a comment explaining the deferral scope.

The Analyst's output was not a requirements document. It was a **decision log**: each conflict, its resolution, and who it unblocks. The Architect could not proceed until every conflict had a resolution — not a compromise, but a decision with a rationale.

---

## Phase 2: Architect (Winston) — The Technical Spine

With conflicts resolved, Winston designed the system before any code was written. The architecture decisions that shaped every subsequent story:

**Data model decisions:**

- `Department` stored as a plain `string`, not a FK to a departments table. Architecture.md §4.1 documents a full departments table for future use, but the MVP has no department management UI — a FK would require seeding data that doesn't exist yet. Deviation documented.

- `Incident.IncidentReference` follows the pattern `INC-{YYYY}-{NNNN}` — sequential per year. The generation logic lives in `CreateIncidentCommandHandler`, not in the database, so it works without database sequences that differ across PostgreSQL and SQLite.

- `IIncidentStateMachine` is an injected interface, not a static class. Every status transition routes through it. Direct assignment to `Incident.Status` is prohibited (documented in the XML comment on the property itself). This means state transition logic is testable in isolation and the 7-state MVP machine can be swapped for the 16-state governance machine without touching any controller or command handler.

**API contract decisions:**

- Approve and Reject endpoints live on `ApproverController` but are routed as `/api/v1/incidents/{id}/approve` (absolute routes), not `/api/v1/approver/incidents/{id}/approve`. This matches the documented contract in architecture.md §7 and means client URL generation doesn't depend on controller hierarchy.

- File uploads use `multipart/form-data` with a 6 MB hard limit enforced at the controller via `[RequestSizeLimit]` — not in application logic, so it fails fast before business logic runs.

The Architect's output was `architecture.md` — a living document updated whenever a new story introduces a deviation from the original design. No story was written until Winston had signed off on the data model for that epic.

---

## Phase 3: PM (John) — Story Sequencing and Definition of Done

John's role was to take the architecture and produce shippable stories in the right order. The sequencing decisions here are non-obvious and easily wrong:

**FS-01 (Auth)** before **FS-02 (Report Form)** — because every subsequent story requires a JWT `sub` claim to identify the reporter. Building the form before auth would mean rewriting every handler when auth was added.

**FS-03 (Attachments)** after **FS-02 (Create Incident)** — because attachments are linked to an incident ID, which doesn't exist until FS-02 ships. Attempting to build attachments first would require mock incident IDs that pollute the data model.

**FS-04 (Approver Queue)** before **FS-05 (Approve/Reject)** — because the queue view is the entry point for the approval workflow. FS-05 builds on the detail page that FS-04 introduced as a stub. Reversing the order would mean building approve/reject buttons with no page to put them on.

Each story had a **Definition of Done** that included: all acceptance criteria verified manually, status updated in the story file, and (for batch commits) the git commit deferred but noted. This meant the DoD was a checklist, not an aspiration.

John also made one structurally important call: **the incident detail view in FS-04 is explicitly a stub** (`IncidentDetailStubComponent`). The component name signals to every future developer that this is temporary, and the FS-05 story explicitly says "extend the stub from FS-04." This is deliberate scope management — not technical debt, but staged delivery.

---

## Phase 4: Dev (Amelia) — Story-by-Story Implementation

Amelia implemented each story against the architecture, using the story file as the only source of truth for what to build. This discipline avoided the most common AI coding failure: **hallucinating features that weren't in scope**.

Concrete implementation decisions that illustrate this:

**FS-02 (Create Incident):** The `CreateIncidentCommandValidator` rejects requests where `Category` is empty or `Severity` is outside 1–4. It does not validate `Department` format — that's not in Epic 1's acceptance criteria and adding it would be scope creep. FluentValidation is wired via `AddScoped<IValidator<CreateIncidentCommand>, CreateIncidentCommandValidator>()` — not the assembly scanner — so each validator registration is explicit and auditable.

**FS-03b (Attachment Upload):** The `LocalFileStorageService` writes files to `wwwroot/uploads/{incidentId}/{filename}`. The `IFileStorageService` interface abstracts the storage location so a future story can swap local disk for Azure Blob Storage without changing any command handler. This abstraction was specified in the architecture, not invented by the developer.

**FS-04 (Approver Queue):** The Angular `roleGuard` checks the JWT role claim client-side, but the story's Dev Notes explicitly say: *"the frontend roleGuard is UX-only. If an unauthenticated user or Reporter tries to hit this endpoint, backend returns 403."* No security guarantee is implied for the frontend check. This distinction — documented in the story — prevents a future developer from removing the backend authorization policy on the assumption that the guard covers it.

---

## Phase 5: QA / Tech Writer (Paige) — Validation and Knowledge Capture

Paige's role in each story was to verify the acceptance criteria and capture decisions that would otherwise exist only in someone's memory.

For FS-05 (Approve/Reject), the QA pass caught a subtle edge case: the `RejectIncidentCommandValidator` enforces a 10-character minimum on `Reason` for both soft and hard rejects — but the Figma design only showed the character counter for the hard reject textarea. Paige flagged the discrepancy; the decision was to enforce the minimum for both (simpler, safer) and document it in the story's Dev Notes.

The Tech Writer role also produced the `EvidenceNote` field on the `Attachment` entity — a nullable string that stores the investigator's caption for a piece of evidence (e.g., "Scene photo — needle entry point"). This field was in the Figma design but not in any story acceptance criterion. Paige added it to the data model decision log, flagged it for the Architect to confirm, and it was added to the `Attachment` entity in `FS-03b` before the migration ran.

---

## Benefits of BMAD on FactoryShield

**1. Conflicts surface before they become code.** The severity integer/label conflict was resolved in the Analyst phase. If it had surfaced in development, it would have required a breaking API change.

**2. Deviations are documented, not hidden.** Every place where the MVP diverges from the full governance spec has a comment — in the enum, in the entity, in the architecture doc. A new developer joining mid-project can read a `// deviation documented` comment and find the full rationale in architecture.md.

**3. Scope is enforced by role separation.** The Dev agent does not invent features. The PM agent does not make data model decisions. When Amelia built the approver queue, she didn't add real-time WebSocket updates because "it would be nice" — John's story explicitly said *"simplest: just navigate away and back."* Role separation kills gold-plating.

**4. The handoff artifact is always a file.** Architecture → `architecture.md`. Story → `FS-0N.md`. Implementation → committed code. Nothing lives in a conversation thread. The project is fully reproducible from the file tree.

---

## Limitations

**BMAD adds overhead for simple tasks.** A CRUD endpoint for a greenfield feature with no cross-cutting concerns does not need five agents. The methodology pays dividends when requirements conflict, roles multiply, or the state machine is non-trivial. Applied to a to-do list app, it is bureaucracy.

**The Architect bottleneck is real.** Every story must wait for the architecture decision log to be updated before the developer can proceed. On FactoryShield, the `Department` field decision (string vs. FK) blocked two stories for a day. In a team setting, this is healthy review latency. In a solo project under deadline, it can feel like friction.

**AI agents don't retain context across sessions.** Each agent starts cold. The architecture.md, the story files, and the decision log are the shared memory. If those files are incomplete or out of date, the next agent will hallucinate facts that contradict the last agent's decisions. The methodology requires discipline in keeping artifacts current.

---

## Conclusion

FactoryShield's development demonstrated that BMAD's value is not in generating more output — it's in generating **less wrong output**. The three conflicting PRDs that opened the project would have produced, under a conventional "build everything" approach, a system where the severity field had three different representations across three layers, the role system was hardcoded to three roles that the governance spec required six of, and the state machine was either over-engineered for MVP or under-engineered for production.

Instead, each conflict became a documented decision. Each decision constrained a story. Each story produced code that matched its constraints. The `IIncidentStateMachine` abstraction exists because the Architect decided it must — not because a developer thought it would be elegant. The `// deviation documented` comments exist because the Analyst logged the deferral — not because a developer left a note.

The discipline of separating roles — even when one AI (or one person) could theoretically play all of them — is what makes complex systems buildable. BMAD operationalizes that discipline as a process, not a principle.

---

*Generated from the FactoryShield project — a .NET 10 Clean Architecture API + Angular 19 frontend for factory safety incident management.*
