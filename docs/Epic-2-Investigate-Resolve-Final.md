6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

## **Epic 2 - Investigate & Resolve Incident** 

FactoryShield — Resolver Epic 

FactoryShield / gstack-review session 

2026-06-29 

## **Persona** 

## **Resolver** 

Factory user responsible for investigating, resolving, and completing assigned incidents. This may include maintenance engineers, quality engineers, safety officers, compliance officers, production engineers, HR representatives, or other authorized users depending on the incident category. 

## **Needs** 

- Receive assigned incidents immediately. 

- View complete incident details and supporting evidence. 

- Investigate and identify the root cause. 

- Record investigation findings. 

- Create and manage corrective actions (CAPA). 

- Assign action owners and due dates. 

- Track action progress and SLA. 

- Upload resolution evidence. 

- Escalate blocked or overdue incidents. 

- Resolve incidents efficiently while maintaining an audit trail. 

- View the complete audit history for an incident they are assigned to. 

## **Epic User Journey** 

- Resolver receives a notification for a newly assigned incident. 

- System displays incident details, history, priority, location, attachments, and previous comments. 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

1/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- Resolver reviews evidence and performs investigation. 

- Resolver records investigation findings and selects the root cause. 

- Resolver creates one or more corrective actions. 

- Each corrective action is assigned to an owner with a due date. 

- Resolver monitors action completion and receives alerts for overdue actions. 

- Resolver uploads photos, documents, or other proof of resolution. 

- If a corrective action has action_status = OVERDUE past the 24-hour grace window, the system triggers an automated SLA escalation to the Manager. 

- Resolver changes incident status to **Resolved** or escalates the incident if additional approval is required. 

- If resolution_status = APPROVED is required, Resolver submits for Manager approval. 

- System records all activities in the audit timeline. 

## **US-1: View Assigned Incidents** 

## **As a Resolver,** 

I want to view incidents assigned to me so that I can begin investigation immediately. 

## **Acceptance Criteria** 

- Given an incident is assigned to me, when I open my dashboard, then it appears in my Assigned Incident list. 

- Given I open my dashboard, then I see badge counts for corrective actions requiring my attention and pending approvals awaiting my submission. 

- Given multiple incidents exist, then I can filter by severity, department, line, equipment, status, or due date. 

- Given I open an incident list, then each card displays severity badge, status, location (line / equipment), reporter name, and reference code. 

- Given I open an incident detail, then I can view all incident details, reporter contact channel, attachments, timeline, and previous comments. 

- Given I have no permission for an incident, then I cannot access it. 

## **Fields** 

incident_id (UUID, internal) 

- incident_reference (string, format: INC-{YYYY}-{NNNN} , human-readable display ID, unique per year) 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

2/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- assignment_id 

- assigned_to 

- severity (enum: LOW , MEDIUM , HIGH , CRITICAL ) 

- category 

- priority 

- status (enum: OPEN , IN_PROGRESS , INVESTIGATION , PENDING_APPROVAL , CLOSED , REJECTED ) department (FK → departments.department_id ) 

- line (string, optional — e.g. “Line 7”) 

- equipment (string, optional — e.g. “Presser Machine 3”) 

- reporter_id (FK → users.user_id , set by Epic 1) 

- reporter_name (denormalized string for display — survives user rename/delete) 

- reported_at 

- SLA_due_date 

## **US-2: Record Investigation & Root Cause** 

## **As a Resolver,** 

I want to document my investigation and identify the root cause so that corrective actions can address the real problem. 

## **Acceptance Criteria** 

- Given I investigate an incident, then I can record investigation notes. 

- Given I need clarification during investigation, then I can view the reporter’s contact channel (or note “anonymous” for confidential reports) and request follow-up. 

- Given investigation is complete, then I **must** select a root_cause_code from the controlled vocabulary before resolution. Optional root_cause_description may accompany it. 

- Given a root cause is required and not yet selected, then resolution cannot continue (system blocks the Resolved button with a validation message). 

- Given investigation is saved, then the timeline records the update. 

- Given I save investigation notes while offline, then the system queues the save locally and syncs to the server when connectivity returns. No investigation data is lost. 

## **Fields** 

- investigation_id 

- investigator_id 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

3/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- investigation_notes 

- **root_cause_code (FK → root_cause_library.code)** — enum-controlled vocabulary: 

- EQUIPMENT_FAILURE , PROCEDURE_GAP , HUMAN_ERROR , DESIGN_DEFECT , EXTERNAL_FACTOR , UNKNOWN_UNDER_INVESTIGATION 

- root_cause_description (optional free text, ≤ 500 chars) 

- investigation_status (enum: NOT_STARTED , IN_PROGRESS , ROOT_CAUSE_IDENTIFIED , BLOCKED ) investigation_completed_at 

- reporter_followup_requested (boolean, optional) 

- reporter_followup_resolved (boolean, optional) 

## **US-3: Create Corrective Actions** 

## **As a Resolver,** 

I want to create corrective actions so that the incident is permanently resolved. 

## **Acceptance Criteria** 

- Given root cause is identified (per US-2), then I can create one or more corrective actions. 

- Given an action is created, then an owner and due date are mandatory. 

- Given multiple actions are required, then each action is tracked separately. 

- Given an action has completion_percentage = 100% AND action_status = COMPLETED , then it counts toward incident resolution eligibility. 

- Given an action is marked COMPLETED, then completion status is updated automatically and a timeline event is recorded. 

- Given an action is marked VERIFIED, then it is locked from further edits (immutable for audit). 

## **Fields** 

- action_id 

- incident_id 

- action_title 

- action_description 

- assigned_owner 

- due_date 

- priority 

- completion_percentage 

action_status (enum: OPEN , IN_PROGRESS , COMPLETED , CANCELLED , VERIFIED , OVERDUE ) 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

4/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

verified_by 

verified_at 

## **US-4: Upload Resolution Evidence** 

## **As a Resolver,** 

I want to upload evidence after completing corrective actions so that the resolution can be verified. 

## **Acceptance Criteria** 

- Given I upload evidence, then it is linked to the incident timeline. 

- Given upload fails (network, server error), then retry is available without losing previously selected files or unsaved metadata. 

- Given unsupported files are uploaded (type, size, malware scan failure), then the system shows validation errors and rejects the file. 

- Given evidence is uploaded successfully, then it is available for reviewer verification. 

- Given two Resolvers upload evidence simultaneously to the same incident, then both uploads succeed with unique attachment_ids and both appear in the timeline. 

## **Fields** 

- attachment_id 

- incident_id 

- attachment_type (enum: PHOTO , DOCUMENT , VIDEO , SENSOR_LOG , OTHER ) 

- upload_status (enum: PENDING , UPLOADED , FAILED , VALIDATED ) 

- uploaded_by 

- uploaded_at 

- evidence_note 

## **US-5: Resolve or Escalate Incident** 

## **As a Resolver,** 

I want to resolve completed incidents or escalate blocked ones so that incidents follow the correct workflow. 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

5/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

## **Acceptance Criteria** 

- Given all corrective actions have action_status IN (COMPLETED, CANCELLED, VERIFIED) AND at least one evidence file has upload_status = VALIDATED , then I can mark the incident as Resolved. 

- Given I mark the incident Resolved, then resolution_status = PENDING (awaits Manager approval if required) or RESOLVED (if approval not required). 

- Given I submit for approval, then I select an approval_type (CLOSE_INVESTIGATION, CAPA_VERIFICATION, ROOT_CAUSE_SIGN_OFF, or RESOLUTION_FINAL) and resolution_status transitions to PENDING . 

- Given additional approval is required (configurable per category), then I can submit for Manager approval and resolution_status transitions to PENDING . 

- Given investigation cannot continue (e.g., missing access, blocked by external dependency), then I can escalate the incident with a mandatory escalation_reason . 

- Given incident status changes, then notifications are sent automatically per the trigger matrix in the Notifications section. 

- Given resolution_status = APPROVED by Manager, then the incident is closed and immutable from Resolver edits. 

## **Fields** 

- resolution_id 

- resolution_status (enum: PENDING , RESOLVED , APPROVED , REJECTED ) 

- resolved_by 

- resolved_at 

- resolution_summary 

- escalation_reason (mandatory if escalated) 

- next_assignee (UUID; null for terminal states) 

- approval_required (boolean; config-driven per category) 

- **approval_type** (FK → approval_definitions.approval_type ; one of CLOSE_INVESTIGATION , 

- CAPA_VERIFICATION , ROOT_CAUSE_SIGN_OFF , RESOLUTION_FINAL ) — each type has its own 

- reviewer chain, SLA, and required evidence 

- approved_by 

- approved_at 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

6/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

## **US-6: Track Assigned Actions** 

## **As a Resolver,** 

I want to monitor all corrective actions so that overdue tasks are completed on time. 

## **Acceptance Criteria** 

- Given actions are assigned, then I can view their current status (counts by status, list with sort/filter). 

- Given an action’s due_date < NOW() , then action_status automatically transitions to OVERDUE and the action is visually highlighted in the UI. 

- Given all actions are COMPLETED or CANCELLED, then incident resolution becomes available per US-5. 

- Given SLA_status = BREACHED for 24 hours without Resolver action, then US-8 SLA escalation triggers automatically. 

## **Fields** 

- action_status 

- due_date 

- completion_date 

- overdue_flag (boolean; derived) 

- SLA_status (enum: ON_TRACK , AT_RISK (within 25% of SLA), BREACHED ) 

## **US-7: View Incident Audit Timeline** 

## **As a Resolver,** 

I want to view the complete audit trail of an incident so that I understand its full history and satisfy compliance requirements. 

## **Acceptance Criteria** 

- Given I open an incident, then I can see a chronological timeline showing every meaningful event. 

- Given the timeline includes status changes, then each entry shows who changed it, from what, to what, and when. 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

7/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- Given comments or investigation notes exist, then they are listed as timeline entries with author and timestamp. 

- Given assignments change, then the timeline records each assignment event with prior and new owner. 

- Given corrective action status changes, then each transition is captured in the timeline. 

- Given evidence is uploaded, then a timeline entry links to the attachment. 

- Given I do not have permission for the incident, then the audit timeline is hidden from me. 

## **Fields** 

timeline_event_id 

- incident_id 

- event_type (enum: STATUS_CHANGED , COMMENT_ADDED , ASSIGNED , INVESTIGATION_SAVED , ROOT_CAUSE_SET , ACTION_CREATED , ACTION_STATUS_CHANGED , EVIDENCE_UPLOADED , ESCALATED , RESOLVED , APPROVED ) 

- event_actor_id 

- event_timestamp 

- previous_value 

- new_value 

- related_entity_id (polymorphic FK) 

- visibility_scope (enum: PUBLIC , INTERNAL , RESTRICTED ) 

## **US-8: Automated SLA Escalation** 

## **As a System,** 

I want to escalate incidents whose corrective actions breach SLA so that blocked work surfaces to the right person without manual chase. 

## **Acceptance Criteria** 

- Given an action’s due_date < NOW() for more than 24 hours (grace window), then the system auto-creates an escalation record with escalation_source = SLA_AUTO . 

- Given SLA escalation triggers, then the action’s SLA_status transitions to BREACHED . 

- Given SLA escalation triggers, then a notification is sent to the assigned Manager with 

- trigger_event = SLA_EXCEEDED and channel IN (IN_APP, EMAIL) . 

- Given a Resolver responds after SLA escalation (updates action progress), then 

- escalation_source record is closed with resolution = SELF_RESOLVED and a timeline entry is 

- recorded. 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

8/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- Given the Manager acknowledges the escalation within 24 hours, then escalation_status = ACKNOWLEDGED and no further auto-escalation occurs. 

- Given neither Resolver nor Manager responds within 48 hours of SLA_status = BREACHED , then a secondary escalation occurs ( escalation_level = 2 ) and the notification fan-out includes the Safety Officer role. 

## **Fields** 

escalation_id 

- incident_id 

- escalation_source (enum: RESOLVER_INITIATED , SLA_AUTO , MANUAL_OVERRIDE ) escalation_level (int, default 1) 

- escalation_reason (auto-generated for SLA path: “SLA breached on action <action_title> for <X>h ”) 

- escalated_to (UUID; Manager by default for SLA_AUTO) 

- escalation_timestamp 

- acknowledged_at (nullable) 

- resolution (enum: OPEN , ACKNOWLEDGED , SELF_RESOLVED , REASSIGNED ) 

## **Epic 2 Field Summary** 

_Fields already defined under each US (US-1 through US-8) are intentionally_ _**not repeated here** . This section captures only fields that span multiple US, plus field-level metadata (type, constraints, FK references) to remove ambiguity for implementers._ 

## **Notifications (added by /gstack-office-hours)** 

**notification_id** (UUID, required, PK) 

- **recipient_role** (enum: REPORTER , RESOLVER , MANAGER , SAFETY_OFFICER ; required; FK → roles.role ) — role-based dispatch, individual user resolved at send-time 

- **channel** (enum: IN_APP , EMAIL , SMS , PUSH ; required) — multi-channel fan-out allowed per trigger 

- **trigger_event** (enum: ASSIGNED , OVERDUE , SLA_EXCEEDED , STATUS_CHANGED , 

- EVIDENCE_UPLOADED , RESOLVED , ESCALATED , APPROVED , REJECTED ; required) — must 

- reference a defined trigger from US-1..US-8 

**sent_at** (timestamp, required) — server-set, immutable 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

9/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- **delivery_status** (enum: PENDING , SENT , DELIVERED , FAILED , RETRYING ; required) — updated by delivery worker 

## **Audit (cross-US, populated by every action)** 

- **timeline_event_id** (UUID, required, PK) 

- **incident_id** (UUID, required; FK → incidents.incident_id ) — indexed for fast per-incident fetch 

- **event_type** (enum: STATUS_CHANGED , COMMENT_ADDED , ASSIGNED , INVESTIGATION_SAVED , ROOT_CAUSE_SET , ACTION_CREATED , ACTION_STATUS_CHANGED , EVIDENCE_UPLOADED , ESCALATED , RESOLVED , APPROVED , REJECTED , SLA_BREACHED ; required) — drives timeline 

- rendering 

- **event_actor_id** (UUID, required; FK → users.user_id ) — set to system UUID for automated events (e.g., SLA escalation) 

- **event_timestamp** (timestamp, required) — UTC, server-set, immutable 

- **previous_value** (string, optional) — null for create events; populated for transitions 

- **new_value** (string, optional) — null for delete events; populated for transitions 

- **related_entity_id** (UUID, optional, polymorphic) — FK to action_id / attachment_id / 

- investigation_id / escalation_id depending on event_type 

- **visibility_scope** (enum: PUBLIC , INTERNAL , RESTRICTED ; required) — honors US-7 permission gate 

## **Escalation (cross-US, populated by US-5 Resolver path and US-8 SLA path)** 

- **escalation_id** (UUID, required, PK) 

- **incident_id** (UUID, required; FK → incidents.incident_id ) 

- **escalation_source** (enum: RESOLVER_INITIATED , SLA_AUTO , MANUAL_OVERRIDE ; required) — distinguishes human vs system escalation 

- **escalation_level** (int, required) — default 1; incremented on secondary auto-escalation 

- **escalated_to** (UUID, required; FK → users.user_id ) — Manager by default for SLA_AUTO 

- **escalation_timestamp** (timestamp, required) — UTC, server-set 

- **acknowledged_at** (timestamp, optional) — set by Manager acknowledging SLA escalation 

- **resolution** (enum: OPEN , ACKNOWLEDGED , SELF_RESOLVED , REASSIGNED ; required) — defaults to OPEN 

## **Resolver Context (session-level, not per-incident)** 

- **resolver_id** (UUID, required; FK → users.user_id ) — current authenticated user 

- **assigned_department** (string, required; FK → departments.department_id ) — used for routing and filter 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

10/11 

6/29/26, 4:28 PM 

Epic 2 - Investigate & Resolve Incident 

- **assigned_role** (enum, required; FK → roles.role ) — matches Resolver persona variant 

## **Enumerations (single source of truth)** 

_Every enum listed above MUST be defined in one place and referenced by ID, not duplicated as inline strings._ 

- **action_status:** OPEN , IN_PROGRESS , COMPLETED , CANCELLED , VERIFIED , OVERDUE 

- **resolution_status:** PENDING , RESOLVED , APPROVED , REJECTED 

- **investigation_status:** NOT_STARTED , IN_PROGRESS , ROOT_CAUSE_IDENTIFIED , BLOCKED 

- **SLA_status:** ON_TRACK , AT_RISK , BREACHED 

- **upload_status:** PENDING , UPLOADED , FAILED , VALIDATED 

- **escalation_source:** RESOLVER_INITIATED , SLA_AUTO , MANUAL_OVERRIDE 

- **root_cause_code:** EQUIPMENT_FAILURE , PROCEDURE_GAP , HUMAN_ERROR , DESIGN_DEFECT , EXTERNAL_FACTOR , UNKNOWN_UNDER_INVESTIGATION 

- **severity:** LOW , MEDIUM , HIGH , CRITICAL 

- **incident_status:** OPEN , IN_PROGRESS , INVESTIGATION , PENDING_APPROVAL , CLOSED , REJECTED 

- **approval_type:** CLOSE_INVESTIGATION , CAPA_VERIFICATION , ROOT_CAUSE_SIGN_OFF , 

- RESOLUTION_FINAL — each type has its own reviewer chain, SLA, and required evidence 

## **Source Traceability** 

**Group-7 Open Spec** - US-002 Report Issue - US-003 Report Offline - US-004 Report Anonymously/Confidentially - Guest Mode - RBAC - Offline sync - Photo validation 

**Group-6 Gstack** - Mobile/kiosk incident reporting - Report-on-behalf - Supervisor classification review - Unique incident ID - Upload failure handling 

**Group-3 BMAD** - Bangla-first quick reporting - Minimal fields - Offline queue - Guest/anonymous reporting - QR-assisted context - Post-submission evidence - Simplified worker status 

**Group-5 Superpowers** - Worker reporting journey - Confidential reporting - Rejection/dispute handling - Audit integrity - Compliance-sensitive reporter privacy 

file:///C:/Users/BS01501/AppData/Local/Temp/Epic-2-FIXED.html 

11/11 

