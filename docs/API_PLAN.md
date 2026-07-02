# FactoryShield — API Plan

**Base URL:** `http://localhost:5263/api/v1`
**Auth:** JWT Bearer — all endpoints except `/auth/login` and `GET /health` require `Authorization: Bearer <token>`
**Swagger UI:** `http://localhost:5263/swagger` (dev only)
**Hangfire Dashboard:** `http://localhost:5263/hangfire` (dev only)

**Status legend:**
- ✅ Done = implemented, route verified against controller source
- 🔲 Planned = in spec but not yet implemented
- ⚠️ Partial = endpoint exists but behaviour incomplete

**Last verified:** 2026-07-01 — full controller scan + golden-path smoke test (Login → Report → Approve → Investigate → RCA → CAPA → Resolve → Analytics)

---

## Health

| Method | Path | Auth | Status |
|--------|------|------|--------|
| `GET`  | `/health` | None | ✅ Done |

---

## Authentication

| Method | Path | Auth | Role | Story | Status |
|--------|------|------|------|-------|--------|
| `POST` | `/auth/login` | None | — | FS-00b | ✅ Done |
| `GET`  | `/auth/me` | Bearer | Any | FS-00b | ✅ Done |
| `POST` | `/auth/logout` | Bearer | Any | FS-00b | ✅ Done |

### POST `/auth/login`
**Request:**
```json
{ "email": "reporter@factoryshield.dev", "password": "Reporter123!" }
```
**Response 200:**
```json
{ "token": "<jwt>", "role": "REPORTER", "userId": "<guid>" }
```
**Response 401:** `{ "error": "Invalid email or password." }`

### GET `/auth/me`
**Response 200:**
```json
{ "userId": "<guid>", "email": "user@factoryshield.dev", "role": "APPROVER" }
```

---

## Administration — Roles & RBAC

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`    | `/admin/roles` | Bearer | Admin | ✅ Done |
| `POST`   | `/admin/roles` | Bearer | Admin | ✅ Done |
| `PUT`    | `/admin/roles/{id}` | Bearer | Admin | ✅ Done |
| `DELETE` | `/admin/roles/{id}` | Bearer | Admin | ✅ Done |
| `GET`    | `/admin/users` | Bearer | Admin | ✅ Done |
| `POST`   | `/admin/users/{userId}/roles` | Bearer | Admin | ✅ Done |
| `DELETE` | `/admin/users/{userId}/roles/{roleId}` | Bearer | Admin | ✅ Done |

### Role object shape
```json
{
  "id": "<guid>",
  "code": "REPORTER",
  "label": "Worker",
  "userCount": 1240,
  "permissions": ["report_incident","view_own_incidents","upload_images"]
}
```

Built-in role codes: `REPORTER`, `APPROVER`, `RESOLVER`, `MANAGER`, `PLANT_MANAGER`, `SAFETY_OFFICER`, `COMPLIANCE_OFFICER`, `ADMIN`

---

## Administration — Categories

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`    | `/admin/categories` | Bearer | Admin | ✅ Done |
| `POST`   | `/admin/categories` | Bearer | Admin | ✅ Done |
| `PUT`    | `/admin/categories/{id}` | Bearer | Admin | ✅ Done |
| `DELETE` | `/admin/categories/{id}` | Bearer | Admin | ✅ Done |
| `POST`   | `/admin/categories/{id}/subcategories` | Bearer | Admin | ✅ Done |
| `DELETE` | `/admin/categories/{id}/subcategories/{sub}` | Bearer | Admin | ✅ Done |

### GET `/admin/categories` response
```json
[{
  "id": "<guid>",
  "name": "Occupational Safety",
  "active": true,
  "subcategories": ["Needle Injury","Laceration","Burn","Slip & Fall"]
}]
```

---

## Administration — Departments

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`    | `/admin/departments` | Bearer | Admin | ✅ Done |
| `POST`   | `/admin/departments` | Bearer | Admin | ✅ Done |
| `PUT`    | `/admin/departments/{id}` | Bearer | Admin | ✅ Done |
| `DELETE` | `/admin/departments/{id}` | Bearer | Admin | ✅ Done |

### Department object shape
```json
{
  "id": "<guid>",
  "name": "Sewing",
  "manager": "Sumaiya Akter",
  "location": "Building A, Floor 2",
  "active": true
}
```

---

## Administration — Severity Levels & Priorities

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/admin/severity-levels` | Bearer | Admin | ✅ Done |
| `PUT`  | `/admin/severity-levels/{id}` | Bearer | Admin | ✅ Done |
| `GET`  | `/admin/priorities` | Bearer | Admin | ✅ Done |
| `PUT`  | `/admin/priorities/{id}` | Bearer | Admin | ✅ Done |

### Severity level shape
```json
{
  "id": "<guid>",
  "code": "L1",
  "label": "Critical",
  "color": "#ef4444",
  "slaHours": 2,
  "autoEscalate": true
}
```

---

## Administration — Factory Structure

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/admin/factories` | Bearer | Admin | ✅ Done |
| `PUT`  | `/admin/factories/{id}` | Bearer | Admin | ✅ Done |
| `GET`  | `/admin/factories/{id}/lines` | Bearer | Admin | ✅ Done |
| `POST` | `/admin/factories/{id}/lines` | Bearer | Admin | ✅ Done |

---

## Administration — Notification Templates

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/admin/notification-templates` | Bearer | Admin | ✅ Done |
| `PUT`  | `/admin/notification-templates/{id}` | Bearer | Admin | ✅ Done |

### Template shape
```json
{
  "id": "<guid>",
  "triggerEvent": "INCIDENT_CRITICAL",
  "channels": ["Email","SMS","Push"],
  "subjectTemplate": "CRITICAL: {{category}} reported at {{location}}",
  "bodyTemplate": "Incident {{reference}} requires immediate attention.",
  "active": true
}
```

---

## Incidents (Reporter)

| Method | Path | Auth | Role | Story | Status |
|--------|------|------|------|-------|--------|
| `POST` | `/incidents` | Bearer | Any | FS-01 | ✅ Done |
| `GET`  | `/incidents/mine` | Bearer | Any | FS-03 | ✅ Done |
| `GET`  | `/incidents/{id}` | Bearer | Any (own) / Approver / Resolver / Governance | FS-03 | ⚠️ Partial |
| `POST` | `/incidents/{id}/attachments` | Bearer | Any | FS-02 | ✅ Done |
| `GET`  | `/incidents/{id}/attachments` | Bearer | Any authenticated | FS-10 | ✅ Done |
| `POST` | `/incidents/{id}/provide-info` | Bearer | Any | FS-19 | ✅ Done |
| `POST` | `/incidents/offline-sync` | Bearer | Any | FS-25 | ✅ Done |
| `GET`  | `/incidents/offline-sync/status` | Bearer | Any | FS-25 | ✅ Done |
| `POST` | `/incidents/{id}/dispute` | Bearer | Reporter | FS-05 | 🔲 Planned |

### POST `/incidents`
**Request:**
```json
{
  "category": "Injury",
  "shortDescription": "Worker slipped near machine M-042",
  "severity": 2,
  "department": "Cutting Floor"
}
```
- `severity`: 1=Critical, 2=High, 3=Medium, 4=Low (default 4)
- `category`: required, max 100 chars
- `shortDescription`: required, max 500 chars
- `department`: optional

**Response 201:**
```json
{ "incident_id": "<guid>", "incident_reference": "INC-2026-0001" }
```
**Response 400:** `{ "errors": { "Category": ["Category is required."] } }`

**Side effects:** Starts a `TRIAGE` SLA clock for the new incident.

### GET `/incidents/mine`
Returns the authenticated reporter's incidents, newest first.

**Response 200:**
```json
[{
  "id": "<guid>",
  "incidentReference": "INC-2026-0001",
  "category": "Injury",
  "severity": 2,
  "displayStatus": "Submitted",
  "createdAt": "2026-07-01T08:00:00Z"
}]
```

### POST `/incidents/{id}/attachments`
**Content-Type:** `multipart/form-data`
**Body field:** `file` (JPEG / PNG / PDF, max 6 MB)

**Response 201:** `{ "attachment_id": "<guid>" }`
**Response 400:** `{ "error": "No file uploaded." }` / file type / size violations
**Response 404:** incident not found

### POST `/incidents/{id}/provide-info`
Reporter's response to an Approver's "Request More Info". Resumes the SLA clock.

**Request:** `{ "information": "The machine guard was removed during yesterday's maintenance shift." }`

**Response 200:** `{}`

---

## Approver

| Method | Path | Auth | Role | Story | Status |
|--------|------|------|------|-------|--------|
| `GET`    | `/approver/queue` | Bearer | ApproverOnly | FS-04 | ✅ Done |
| `GET`    | `/approver/resolvers` | Bearer | ApproverOnly | FS-05 | ✅ Done |
| `POST`   | `/incidents/{id}/approve` | Bearer | ApproverOnly | FS-05 | ✅ Done |
| `POST`   | `/incidents/{id}/reject` | Bearer | ApproverOnly | FS-05 | ✅ Done |
| `POST`   | `/incidents/{id}/escalate` | Bearer | ApproverOnly | FS-15 | ✅ Done |
| `POST`   | `/incidents/{id}/escalation/{escalationId}/acknowledge` | Bearer | ApproverOnly | FS-15 | ✅ Done |
| `POST`   | `/incidents/{id}/claim` | Bearer | ApproverOnly | FS-16 | ✅ Done |
| `DELETE` | `/incidents/{id}/claim` | Bearer | ApproverOnly | FS-16 | ✅ Done |
| `POST`   | `/incidents/{id}/reassign` | Bearer | ApproverOnly | FS-17 | ✅ Done |
| `POST`   | `/incidents/{id}/merge` | Bearer | ApproverOnly | FS-18 | ✅ Done |
| `POST`   | `/incidents/{id}/request-info` | Bearer | ApproverOnly | FS-19 | ✅ Done |
| `GET`    | `/incidents/{id}/approval-audit-trail` | Bearer | Approver/Governance/Admin | FS-29 | ✅ Done |

### GET `/approver/queue`
Returns all `Submitted` incidents sorted by severity (Critical first), then age (oldest first). Includes active SLA clock data.

**Query params:** `?severity=&category=&status=&claimState=unclaimed|claimed|mine` (all optional)

**Response 200:**
```json
[{
  "id": "<guid>",
  "incidentReference": "INC-2026-0001",
  "category": "Injury",
  "severity": 1,
  "displayStatus": "Submitted",
  "reporterDisplay": "Karim H.",
  "isConfidential": false,
  "claimedBy": null,
  "claimedAt": null,
  "disputeStatus": null,
  "createdAt": "2026-07-01T08:00:00Z",
  "slaStartedAt": "2026-07-01T08:00:00Z",
  "slaTargetMinutes": 60,
  "slaStage": "TRIAGE"
}]
```

> **Confidentiality rule (FS-24):** When `isConfidential = true` and the caller does not hold `APPROVER_L2`, `COMPLIANCE_OFFICER`, or `ADMIN`, then `reporterDisplay = "🔒 Confidential"` and reporter contact fields are omitted. The `ConfidentialityService.MaskIfNeeded()` chokepoint handles this server-side — never trust client-side hiding alone.

### GET `/incidents/{id}`
Returns full incident detail. The response shape is role-scoped:
- **Reporter** — own incidents only; `displayStatus` projection; no internal notes
- **Approver** — full details incl. evidence list, timeline, confidentiality-masked reporter
- **Resolver** — same as Approver + investigation/CAPA data
- **Governance/Admin** — unrestricted

> **⚠️ Partial:** Endpoint exists. Investigation, RCA, Comments, and History tabs still return placeholder data in the Angular `incident-detail.component.ts`. Backend data is available — frontend wiring incomplete (P1 gap).

**Response 200:**
```json
{
  "id": "<guid>",
  "incidentReference": "INC-2026-0001",
  "category": "Injury",
  "severity": 2,
  "status": "Submitted",
  "displayStatus": "Submitted",
  "shortDescription": "Worker slipped near machine M-042",
  "department": "Cutting Floor",
  "line": "Line 7",
  "equipment": "M-0042",
  "reporterId": "<guid>",
  "reporterDisplay": "Karim H.",
  "reporterContactChannel": "email",
  "isConfidential": false,
  "handoffNote": null,
  "createdAt": "2026-07-01T08:00:00Z",
  "slaStartedAt": "2026-07-01T08:00:00Z",
  "slaTargetMinutes": 60,
  "slaStage": "TRIAGE",
  "disputeStatus": null,
  "disputeWindowUntil": null,
  "attachments": [],
  "timelineEvents": []
}
```
**Response 403:** Reporter accessing another user's incident
**Response 404:** incident not found
```

### POST `/incidents/{id}/approve`
**Request:** `{ "resolverUserId": "<guid>" }`

**Response 200:** `{}`
**Side effects:** Stops TRIAGE clock, starts ASSIGNMENT clock, sets `AssignedResolverId`.

### POST `/incidents/{id}/reject`
**Request:**
```json
{ "rejectType": "Soft", "reason": "Duplicate of INC-2026-0009" }
```
- `rejectType`: `"Soft"` | `"Hard"`
- `reason`: min 10 characters

### POST `/incidents/{id}/escalate`
**Request:** `{ "reason": "No approver available for this shift" }`

**Side effects:** Increments `Incident.EscalationLevel`, writes `Escalations` row.

### POST `/incidents/{id}/escalation/{escalationId}/acknowledge`
Approver acknowledges an active escalation, changing its resolution to `ACKNOWLEDGED`.

**Response 200:** `{}`
**Response 404:** incident or escalation not found

### POST `/incidents/{id}/claim`
Soft-locks the incident to the authenticated Approver for 10 minutes. Prevents another Approver from simultaneously working the same case (FS-16).

**Response 200:** `{}`
**Response 409:** already claimed by another approver

### POST `/incidents/{id}/reassign`
**Request:** `{ "newCategory": "Equipment Failure", "newSeverity": 3, "reason": "Recategorised after evidence review" }`
**Response 400:** loop guard triggered (`reroute_count >= 2`)

### POST `/incidents/{id}/merge`
**Request:** `{ "primaryIncidentId": "<guid>", "reason": "Same event as INC-2026-0012" }`

### POST `/incidents/{id}/request-info`
**Request:** `{ "question": "Please provide the machine ID and shift details." }`

### GET `/incidents/{id}/approval-audit-trail`
Returns the immutable approval-chain audit timeline (FS-29 / Approver PRD US-11).

**Response 200:**
```json
{
  "incidentId": "<guid>",
  "incidentReference": "INC-2026-0001",
  "currentEscalationLevel": 1,
  "loopGuardTriggered": false,
  "routeCount": 0,
  "approvalChain": [{
    "gate": "CloseInvestigation",
    "approvalLevelAtAction": 0,
    "actorName": "Alice Smith",
    "actorRole": "GOVERNANCE",
    "isApprove": true,
    "rejectionReason": null,
    "submittedAt": "2026-07-01T10:00:00Z"
  }],
  "claimHistory": [{
    "approverName": "Bob Jones",
    "approverRole": "APPROVER",
    "claimedAt": "2026-07-01T08:05:00Z",
    "expiresAt": "2026-07-01T08:15:00Z",
    "isActive": false,
    "durationMinutes": 10
  }],
  "routingEvents": []
}
```

---

## Resolver

| Method | Path | Auth | Role | Story | Status |
|--------|------|------|------|-------|--------|
| `GET`  | `/resolver/assigned` | Bearer | ResolverOnly | FS-06 | ✅ Done |
| `POST` | `/incidents/{id}/investigation` | Bearer | ResolverOnly | FS-07 | ✅ Done |
| `GET`  | `/incidents/{id}/investigation` | Bearer | ResolverOnly | FS-08 | ✅ Done |
| `PUT`  | `/incidents/{id}/investigation` | Bearer | ResolverOnly | FS-08 | ✅ Done |
| `POST` | `/incidents/{id}/investigation/checklist/{itemId}/toggle` | Bearer | ResolverOnly | FS-09 | ✅ Done |
| `POST` | `/incidents/{id}/investigation/block` | Bearer | ResolverOnly | FS-09 | ✅ Done |
| `GET`  | `/incidents/{id}/actions` | Bearer | ResolverOnly | FS-11 | ✅ Done |
| `POST` | `/incidents/{id}/actions` | Bearer | ResolverOnly | FS-11 | ✅ Done |
| `PATCH`| `/actions/{actionId}` | Bearer | ResolverOnly | FS-11 | ✅ Done |
| `POST` | `/actions/{actionId}/evidence` | Bearer | ResolverOnly | FS-11b | ✅ Done |
| `POST` | `/actions/{actionId}/complete` | Bearer | ResolverOnly | FS-11b | ✅ Done |
| `GET`  | `/incidents/{id}/actions/summary` | Bearer | Any | FS-11c | ✅ Done |
| `POST` | `/incidents/{id}/resolve` | Bearer | ResolverOnly | FS-12 | ✅ Done |

### GET `/resolver/assigned`
Returns incidents assigned to the authenticated resolver (status: Triaged / Assigned / InProgress), sorted by severity then age.

### POST `/incidents/{id}/investigation`
Creates an `Investigation` with 8 checklist items seeded and 1 timeline event. Idempotent — returns existing if already created.

**Response 200:** `{ "investigationId": "<guid>" }`

### GET `/incidents/{id}/investigation`
**Response 200:**
```json
{
  "investigationId": "<guid>",
  "incidentId": "<guid>",
  "incidentReference": "INC-2026-0001",
  "incidentTitle": "Worker slipped near machine M-042",
  "owner": "Jane Doe",
  "investigationDate": "2026-07-01T00:00:00Z",
  "targetCompletionDate": "2026-07-08T00:00:00Z",
  "riskLevel": "High",
  "notes": "...",
  "findingsSummary": "...",
  "immediateActionTaken": "...",
  "lessonsLearned": "...",
  "checklistItems": [{
    "id": "<guid>",
    "label": "Review incident scene photos and videos",
    "sortOrder": 1,
    "isCompleted": false
  }],
  "timelineEvents": [{
    "id": "<guid>",
    "eventText": "Investigation started",
    "occurredAt": "2026-07-01T08:10:00Z"
  }]
}
```

### POST `/incidents/{id}/investigation/block`
Marks the investigation as `BLOCKED` with a reason (e.g., waiting for lab results).

**Request:** `{ "reason": "Awaiting toxicology report from external lab" }`
**Response 200:** `{}`

### POST `/incidents/{id}/investigation/checklist/{itemId}/toggle`
Flips `IsCompleted`. If all 8 items complete, appends a timeline event.

**Response 200:**
```json
{ "isCompleted": true, "completedCount": 5, "totalCount": 8 }
```

### POST `/actions/{actionId}/evidence`
**Content-Type:** `multipart/form-data` — field `file`
**Response 201:** `{ "attachmentId": "<guid>" }`

### POST `/actions/{actionId}/complete`
Sets `status = Completed`, `completionPercentage = 100`.
**Response 200:** `{}`
**Response 400:** already completed

### GET `/incidents/{id}/actions/summary`
```json
{
  "totalActions": 5, "inProgress": 2, "open": 3,
  "completed": 0, "overallPercentage": 18
}
```

### POST `/incidents/{id}/resolve`
Validates ≥ 1 CAPA action exists; transitions status to `RESOLVED`.

**Response 200:** `{}`
**Response 400:** no CAPA actions, invalid state

---

## Root Cause Analysis (RCA)

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/incidents/{id}/rca` | Bearer | Resolver/Admin | ✅ Done |
| `PUT`  | `/incidents/{id}/rca` | Bearer | Resolver | ✅ Done |
| `POST` | `/incidents/{id}/rca/submit` | Bearer | Resolver | ✅ Done |

### GET `/incidents/{id}/rca`
**Response 200:**
```json
{
  "incidentId": "<guid>",
  "incidentReference": "INC-2026-0001",
  "method": "5why",
  "problemStatement": "Operator sustained needle injury",
  "whyEntries": [
    { "order": 1, "text": "Machine guard was missing" },
    { "order": 2, "text": "Guard removed during cleaning and not reinstated" }
  ],
  "fishboneCategories": {
    "man": "No finger guard worn",
    "machine": "Guard missing from M-0042",
    "method": "No post-cleaning checklist",
    "material": "",
    "environment": "High production pressure",
    "management": "Supervisor not present"
  },
  "structuredCategory": "Equipment / Machine",
  "status": "Draft",
  "submittedAt": null
}
```

### PUT `/incidents/{id}/rca`
All fields optional (partial update).
```json
{
  "method": "5why",
  "problemStatement": "...",
  "whyEntries": [{ "order": 1, "text": "..." }]
}
```

### POST `/incidents/{id}/rca/submit`
Marks RCA as `Submitted`.
**Response 200:** `{}`
**Response 400:** required fields not completed

---

## Escalation

| Method | Path | Auth | Role | Story | Status |
|--------|------|------|------|-------|--------|
| `GET`    | `/escalations/active` | Bearer | Approver/Admin | FS-15b | ✅ Done |
| `GET`    | `/escalations/rules` | Bearer | Admin | FS-15c | ✅ Done |
| `POST`   | `/escalations/rules` | Bearer | Admin | FS-15c | ✅ Done |
| `PUT`    | `/escalations/rules/{id}` | Bearer | Admin | FS-15c | ✅ Done |
| `DELETE` | `/escalations/rules/{id}` | Bearer | Admin | FS-15c | ✅ Done |
| `GET`    | `/escalations/notifications` | Bearer | Admin | FS-15d | ✅ Done |

### GET `/escalations/active`
```json
[{
  "id": "<guid>",
  "incidentId": "<guid>",
  "incidentReference": "INC-2026-0001",
  "severity": "Critical",
  "title": "Needle injury on Line 7",
  "escalatedTo": "Level 2 — Factory Manager",
  "day": 1,
  "progressPct": 65,
  "slaRemainingMinutes": 270,
  "slaOverdue": false
}]
```

### GET `/escalations/rules`
```json
[{
  "id": "<guid>",
  "name": "High Severity Auto Escalation",
  "triggerAfterMinutes": 120,
  "channels": ["Email","SMS"],
  "recipients": ["Supervisor","Safety Manager"],
  "active": true
}]
```

### GET `/escalations/notifications`
```json
[{
  "id": "<guid>",
  "incidentReference": "INC-2026-0001",
  "ruleName": "Critical Immediate Escalation",
  "via": "Email",
  "recipients": "Factory Manager",
  "sentAt": "2026-07-01T09:23:10Z",
  "status": "Delivered"
}]
```

---

## Governance & Dual-Control Approvals

| Method | Path | Auth | Role | Story | Status |
|--------|------|------|------|-------|--------|
| `POST` | `/approvals/{incidentId}` | Bearer | Governance | FS-21 | ✅ Done |
| `GET`  | `/dashboard/executive` | Bearer | Governance | FS-22 | ✅ Done |
| `GET`  | `/incidents/{id}/timeline` | Bearer | Any | FS-23 | ✅ Done |
| `POST` | `/governance/incidents/{incidentId}/unmask-reporter` | Bearer | Governance/Admin | FS-24 | ✅ Done |

### POST `/approvals/{incidentId}`
Dual-control approval gate. Requires 2 distinct actors per `approvalType` (SoD enforced).

**Request:**
```json
{
  "approvalType": "CloseInvestigation",
  "isApprove": true,
  "rejectionReason": null
}
```
- `approvalType`: `CloseInvestigation` | `RootCauseSignOff` | `CapaVerification` | `ResolutionFinal`
- **Response 403:** same actor approving same stage twice (SoD violation)

### GET `/dashboard/executive`
**Response 200:**
```json
{
  "totalIncidents": 142,
  "openIncidents": 23,
  "resolvedIncidents": 119,
  "bySeverity": { "Critical": 5, "High": 18, "Medium": 67, "Low": 52 },
  "avgResolutionMinutes": 3240,
  "capaCompletionRate": 0.84
}
```

### POST `/governance/incidents/{incidentId}/unmask-reporter`
Reveals the confidential reporter's identity to the caller. Writes an `IdentityAccessAudit` row (append-only).

**Request:** `{ "reason": "Required for formal investigation under §4.1" }`
**Response 200:** `{ "reporterName": "...", "reporterEmail": "..." }`

---

## Compliance Dashboard (FS-27)

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/compliance/dashboard` | Bearer | ComplianceOfficer/Admin | ✅ Done |
| `GET`  | `/compliance/identity-access-audit` | Bearer | ComplianceOfficer/Admin | ✅ Done |
| `GET`  | `/compliance/export/{incidentId}` | Bearer | ComplianceOfficer/Admin | ✅ Done |

### GET `/compliance/dashboard`
Query params: `?from=&to=` (ISO 8601, defaults to last 30 days)

Returns 7 panels:
- **Panel A** — Incident Pipeline by canonical state
- **Panel B** — Investigation Methodology distribution (5WHY, FISHBONE, etc.)
- **Panel C** — Overdue / Repeat-Failure CAPAs (`rejectionCount >= 2`)
- **Panel D** — Identity Access Audit log (last 100 entries, excludes caller's own entries)
- **Panel E** — Rejection Dispute Summary (Soft-rejected incidents)
- **Panel F** — Loop Guard & Tiebreak Pending (`loopGuardTriggered = true`)
- **Panel G** — Escalation Exhausted (`escalationExhausted = true`)

### GET `/compliance/identity-access-audit`
Dedicated filterable identity-access audit log. SoD: caller's own entries excluded.

Query params: `?from=&to=&actorId=` (all optional)

**Response 200:**
```json
[{
  "accessorName": "Bob Jones",
  "accessorRole": "APPROVER",
  "incidentReference": "INC-2026-0001",
  "purpose": "Required for formal investigation",
  "accessedAt": "2026-07-01T09:00:00Z"
}]
```

### GET `/compliance/export/{incidentId}`
Generates a watermarked PDF evidence package.

Watermark: `"CONFIDENTIAL — iFar-Silexa (Pvt.) Ltd. — Case [ID] — Exported by [Name] on [Date]"` (Governance §3.4)

**Side effect:** Writes a new `IdentityAccessAudit` row for the export event itself.

**Response 200:** `application/pdf` file download

---

## Analytics & Reports

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/analytics/kpi` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/incident-trend` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/department-performance` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/severity-distribution` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/recurring-issues` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/root-cause-distribution` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/closure-rate` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/resolution-time` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/export/pdf` | Bearer | Governance | ✅ Done |
| `GET`  | `/analytics/export/excel` | Bearer | Governance | ✅ Done |

All analytics endpoints accept `?period=6m` (values: `1m`, `3m`, `6m`, `12m`).

### GET `/analytics/kpi`
```json
{
  "period": "6m",
  "totalIncidents": 236,
  "totalIncidentsTrend": 12.0,
  "avgResolutionHours": 4.2,
  "avgResolutionTrend": -0.8,
  "slaCompliancePct": 94.1,
  "slaComplianceTrend": 2.1,
  "recurringRatePct": 18.2,
  "recurringRateTrend": -3.1
}
```

### GET `/analytics/root-cause-distribution`
```json
[
  { "category": "Machine", "count": 45, "pct": 35.2 },
  { "category": "Method", "count": 32, "pct": 25.0 }
]
```

### GET `/analytics/closure-rate`
```json
[
  { "month": "Jan 2026", "reported": 38, "closed": 30, "closureRatePct": 78.9 },
  { "month": "Feb 2026", "reported": 45, "closed": 39, "closureRatePct": 86.7 }
]
```

### GET `/analytics/resolution-time`
```json
{
  "overallAvgHours": 18.5,
  "byDepartment": [{ "group": "Sewing", "avgHours": 14.2, "count": 58 }],
  "bySeverity": [{ "group": "CRITICAL", "avgHours": 4.1, "count": 8 }],
  "byCategory": [{ "group": "Needle Injury", "avgHours": 12.3, "count": 24 }]
}
```

---

## Notifications

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/notifications` | Bearer | Any | ✅ Done |
| `POST` | `/notifications/{id}/read` | Bearer | Any | ✅ Done |
| `POST` | `/notifications/read-all` | Bearer | Any | ✅ Done |
| `GET`  | `/notifications/count` | Bearer | Any | ✅ Done |

### GET `/notifications`
Query params: `?unreadOnly=true&page=1&pageSize=20`

```json
[{
  "id": "<guid>",
  "title": "Critical Incident Reported",
  "message": "Chemical spill in Finishing section — INC-2026-0001",
  "type": "INCIDENT_CRITICAL",
  "unread": true,
  "createdAt": "2026-07-01T09:14:00Z"
}]
```

### GET `/notifications/count`
```json
{ "unread": 3 }
```

---

## QR Code Management (FS-26)

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| `GET`  | `/qr/{code}` | None | — | ✅ Done |
| `GET`  | `/qr` | Bearer | Admin | ✅ Done |
| `POST` | `/qr` | Bearer | Admin | ✅ Done |
| `PUT`  | `/qr/{id}` | Bearer | Admin | ✅ Done |

### GET `/qr/{code}`
Public endpoint — resolves a QR code string to the target incident/location context.
Used by the mobile scanner to pre-fill incident submission form.

**Response 200:** `{ "locationLabel": "Line 7 — Sewing", "factoryId": "<guid>", "lineId": "<guid>" }`
**Response 404:** QR code not found or inactive

---

## Deferred / Production Hardening

These are intentional deferrals — not missing API surface:

| Area | Item | Note |
|------|------|------|
| Notifications | Real Email/SMS provider | Dev stubs (`DevEmailService` / `DevSmsService`) log to console only |
| Notifications | SignalR real-time push | Currently 60s polling; SignalR is the documented production upgrade path |
| Notifications | Digest-batching & active-viewer suppression | Code present, not verified in integration test |
| Hangfire | Production auth on `/hangfire` | Currently open in dev; must restrict to ADMIN in production |

---

## Error Response Shape

All error responses follow one of two formats:

```json
// Single error
{ "error": "Incident not found." }

// Validation errors (FluentValidation)
{ "errors": { "FieldName": ["Error message 1", "Error message 2"] } }
```

## HTTP Status Codes Used

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GET / action success (no created resource) |
| 201 | Created | POST that creates a new resource |
| 400 | Bad Request | Validation failure, invalid state transition |
| 401 | Unauthorized | Missing / invalid / expired JWT |
| 403 | Forbidden | Correct role but business rule violation (e.g. SoD) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate claim, merge conflict |

---

## Demo Users (Seeded)

| Email | Password | Role |
|-------|----------|------|
| `reporter@factoryshield.dev` | `Reporter123!` | REPORTER |
| `approver@factoryshield.dev` | `Approver123!` | APPROVER |
| `resolver@factoryshield.dev` | `Resolver123!` | RESOLVER |
| `admin@factoryshield.dev` | `Admin123!` | ADMIN |
