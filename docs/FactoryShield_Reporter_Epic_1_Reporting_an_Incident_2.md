# FactoryShield — Epic 1: Reporting an Incident

## Persona: Reporter

Factory user who reports an issue. This may include workers, line users, supervisors, quality inspectors, maintenance users, safety/compliance users, visitors, contractors, or other authorized users depending on factory policy.

### Needs

- Simple multi-lingual reporting with icon-friendly choices.
- Minimal typing and fast submission from mobile, kiosk, shared tablet, or QR entry point.
- Photo upload and optional supporting evidence.
- Offline reporting with clear sync status.
- Login or Guest Mode reporting, including anonymous/confidential reporting where enabled.
- Clear confirmation, incident/reference ID, and simple status visibility after submission.

---

## Epic 1: Reporting an Incident

Reporter can capture an issue from the factory floor quickly, even with low digital literacy or poor network connectivity, and submit enough information for the Approver and Resolver personas to review, assign, and act.

> This epic consolidates Reporter requirements from the attached PRDs, including Group-7 US-002 Report Issue, US-003 Report Offline, US-004 Report Anonymously/Confidentially, plus related mobile/kiosk, guest, QR, photo, and report-on-behalf requirements from the other PRDs.

### Epic User Journey

1. Reporter opens FactoryShield from app, kiosk, shared tablet, Guest Mode page, or QR code.
2. System shows only the reporting options allowed for the current access mode and factory configuration.
3. Reporter chooses incident type/category, location context, and severity. Severity defaults to **Low** unless changed.
4. Reporter adds the minimum useful detail: quick option, short note, photo, voice note, or supporting evidence.
5. If internet is unavailable, system saves the report locally and clearly marks it as **Not Synced**.
6. Reporter submits the report online or later syncs it when connectivity returns.
7. System creates one incident/reference ID, records source, timestamp, and reporting mode, then notifies the configured review queue.
8. Reporter sees confirmation and a simple status view such as `Submitted`, `Under Review`, `In Progress`, `Resolved`, or `Rejected`.
9. Reporter may add permitted follow-up evidence or clarification without changing the original submitted record.
10. If the report is rejected, Reporter sees the reason and may clarify or dispute where policy allows.

---

## User Stories

### US-1: Access Reporting by Login, Guest Mode, or QR

> As a Reporter, I want to enter the reporting flow from the easiest allowed access point so that I can report an issue without learning the full system.

#### Acceptance Criteria

- **Given** I open FactoryShield, **when** Login is available, **then** I can enter the reporting flow after valid authentication.
- **Given** Guest Mode is enabled, **when** I choose Guest Mode, **then** I can access only the permitted reporting flow.
- **Given** Guest Mode is disabled, **when** I try to continue as guest, **then** the system blocks reporting and shows the configured access message.
- **Given** I scan a valid QR code, **when** the QR is active, **then** the system opens the correct reporting flow and pre-fills known factory context.
- **Given** my role or entry mode does not allow a reporting option, **then** that option is hidden or blocked.

#### Fields

| Field | Description |
|---|---|
| `access_mode` | Login, Guest, QR Anonymous |
| `reporter_user_id` or `guest_session_id` | |
| `qr_code_id` | |
| `preferred_language` | |
| `device_type` | |
| `prefilled_factory_id`, `section_id`, `line_id`, `machine_id` | |

---

### US-2: Submit a Quick Incident Report

> As a Reporter, I want to submit a simple incident report with minimal required fields so that responsible people can start review quickly.

#### Acceptance Criteria

- **Given** I have report permission, **when** I open Report Incident, **then** I can enter category/type, location, severity, and a short detail or evidence.
- **Given** a new incident form opens, **then** severity is set to **Low** by default unless I choose Medium or High.
- **Given** required fields are missing, **when** I submit, **then** the system shows field-level errors and does not create the incident.
- **Given** I submit valid information online, **then** the system creates exactly one incident with unique ID, `Submitted/Open` status, source, reporter context, and timestamp.
- **Given** I tap Submit more than once, **then** the system prevents duplicate incidents.
- **Given** the issue is urgent, **when** I select High severity, **then** the configured review/escalation queue is notified.

#### Fields

| Field | Description |
|---|---|
| `incident_id` | |
| `incident_type/category` | |
| `severity` | Low, Medium, High |
| `factory_id`, `department_id`, `section_id`, `line_id` | |
| `location_text` or `machine_id` | |
| `short_description` or `quick_issue_option` | |
| `reporting_mode` | |
| `created_by/source` | |
| `created_at_server_time`, `local_event_time` | |

---

### US-3: Add Photo, Voice Note, or Supporting Evidence

> As a Reporter, I want to attach evidence during or after submission so that the issue is understandable without repeated explanation.

#### Acceptance Criteria

- **Given** I add a supported photo or evidence file, **then** the system accepts it, previews it where possible, and links it to the incident.
- **Given** an image is too large or unsupported, **then** the system rejects or compresses it according to configuration and shows a clear message.
- **Given** upload fails after the incident is created, **then** the incident is not lost and the attachment remains pending or retryable.
- **Given** I add evidence after submission, **then** it is stored as a timeline update and does not overwrite original submitted data.
- **Given** I use a shared device, **then** I cannot see files or evidence from another reporter session.

#### Fields

| Field | Description |
|---|---|
| `attachment_id` | |
| `incident_id` | |
| `attachment_type` | photo, voice_note, document |
| `file_size`, `mime_type` | |
| `upload_status` | |
| `preview_url/storage_key` | |
| `uploaded_by/source` | |
| `uploaded_at` | |
| `is_initial_evidence` | |
| `evidence_note` | |

---

### US-4: Report Offline and Sync Later

> As a Reporter, I want to save and submit an incident without internet so that factory issues are not lost during network outages.

#### Acceptance Criteria

- **Given** there is no internet, **when** I submit an incident, **then** the system saves it as an offline draft or queued report.
- **Given** the report is offline, **then** the UI clearly shows **Not Synced** and warns that management has not received it yet.
- **Given** connectivity returns, **then** the system syncs automatically or provides manual retry.
- **Given** sync succeeds, **then** the report becomes `Submitted/Synced` and receives or confirms a server incident ID.
- **Given** sync fails, **then** status becomes `Sync Failed` and retry remains available.
- **Given** sync retries multiple times, **then** duplicate incidents are not created.

#### Fields

| Field | Description |
|---|---|
| `local_draft_id` | |
| `server_incident_id` | |
| `sync_status` | Draft, Queued, Syncing, Synced, Sync Failed |
| `sync_attempt_count` | |
| `local_event_time` | |
| `server_received_time` | |
| `offline_payload_hash` | |
| `pending_attachment_count` | |
| `sync_error_message` | |

---

### US-5: Report Anonymously or Confidentially

> As a Reporter, I want to hide my identity for sensitive reports so that I can report safety, compliance, grievance, or workplace concerns without fear.

#### Acceptance Criteria

- **Given** anonymous/confidential reporting is enabled, **when** I select that mode, **then** my identity is hidden from standard users.
- **Given** a standard user opens the incident, **then** reporter identity and protected contact data are not visible.
- **Given** an authorized confidentiality role views protected identity/contact data, **then** the access is logged with actor, time, reason, and incident ID.
- **Given** anonymous/confidential reporting is disabled for the selected category, **then** the option is not shown.
- **Given** I submit through QR or Guest anonymous mode, **then** no login is required and I receive a reference token if follow-up is enabled.

#### Fields

| Field | Description |
|---|---|
| `reporting_mode` | normal, confidential, anonymous_guest, anonymous_qr |
| `reporter_visibility` | |
| `protected_reporter_contact` | |
| `anonymous_reference_token` | |
| `sensitive_category_flag` | |
| `identity_access_allowed_roles` | |
| `identity_view_audit_log_id` | |
| `follow_up_allowed` | |

---

### US-6: Report with Location or QR Context

> As a Reporter, I want location, line, or machine details to be prefilled where possible so that the report is faster and more accurate.

#### Acceptance Criteria

- **Given** I scan a machine, line, department, or poster QR code, **then** the system pre-fills available context.
- **Given** prefilled context is wrong or incomplete, **then** I can correct it before submission where policy allows.
- **Given** QR is invalid, expired, or disabled, **then** the system shows a clear error and offers manual reporting if allowed.
- **Given** an incident is submitted from QR, **then** QR source metadata is stored for audit and analytics.
- **Given** location is required but unavailable, **then** the system prompts me to choose factory, section, line, or free-text location.

#### Fields

| Field | Description |
|---|---|
| `qr_code_id` | |
| `qr_type` | machine, line, area, safety_poster, anonymous_public |
| `prefilled_factory_id` | |
| `prefilled_section_id` | |
| `prefilled_line_id` | |
| `prefilled_machine_id` | |
| `manual_override_reason` | |
| `source_channel` | |

---

### US-7: View Confirmation and Simple Status

> As a Reporter, I want confirmation and a simple status view so that I know the report was received and can follow progress.

#### Acceptance Criteria

- **Given** submission succeeds, **then** I see a confirmation message and incident/reference ID.
- **Given** I am logged in, **then** I can view my own submitted incidents and latest simple status.
- **Given** I am a guest or anonymous reporter with a reference token, **then** I can see only limited status and permitted follow-up options.
- **Given** the incident is rejected, **then** I can see the rejection reason.
- **Given** clarification or dispute is allowed, **then** I can add follow-up within the configured window.
- **Given** I view my incident, **then** internal RCA, CAPA, investigation notes, and private supervisor comments remain hidden unless policy allows.

#### Fields

| Field | Description |
|---|---|
| `incident_id` or `reference_token` | |
| `display_status` | Submitted, Under Review, In Progress, Resolved, Rejected |
| `submitted_at` | |
| `last_updated_at` | |
| `rejection_reason` | |
| `clarification_or_dispute_until` | |
| `supplemental_comment` | |
| `supplemental_evidence_attachment` | |
| `status_view_scope` | |

---

### US-8: Report on Behalf of Another Worker

> As an authorized Reporter, I want to create a report on behalf of a worker or verbal source so that low-digital-literacy or device-limited users are still represented in the system.

#### Acceptance Criteria

- **Given** I have report-on-behalf permission, **when** I create an incident, **then** I can identify the affected worker or mark it as reported by line leader/supervisor.
- **Given** I report on behalf of someone else, **then** the system stores the actual creator separately from the affected/reported-by person.
- **Given** I do not have report-on-behalf permission, **then** I cannot select another reporter or affected worker.
- **Given** the source worker should be protected, **then** visibility follows confidential reporting rules.

#### Fields

| Field | Description |
|---|---|
| `created_by_user_id` | |
| `reported_by_user_id` or `source_label` | |
| `affected_worker_id` | |
| `report_on_behalf` | yes / no |
| `source_visibility` | |
| `verbal_report_received_at` | |
| `creator_role` | |
| `permission_check_result` | |

---

## Epic 1 Field Summary

The field groups below should guide Reporter Epic UI, API, and data-model design.

| Group | Fields |
|---|---|
| **Reporter context** | access mode, user ID, guest session, anonymous token, language, device type |
| **Incident basics** | incident ID, category/type, severity, status, reporting mode, short description |
| **Factory context** | factory, department, section, line, location, machine/equipment, QR source |
| **Timing** | observed date/time, local event time, server received time, submitted/synced timestamp |
| **Evidence** | photo, voice note, document, upload status, evidence note, initial/supplemental marker |
| **Offline sync** | local draft ID, sync status, attempt count, payload hash, sync error, pending attachments |
| **Confidentiality** | reporter visibility, protected contact, access role, identity view audit log |
| **Post-submission** | simplified status, rejection reason, clarification/dispute window, follow-up evidence |
| **Audit** | creator, source channel, immutable original submission, timeline events |

---

## Source Traceability

| Source | Coverage |
|---|---|
| **Group-7 Open Spec** | US-002 Report Issue, US-003 Report Offline, US-004 Report Anonymously/Confidentially, Guest Mode, RBAC, offline sync, photo validation |
| **Group-6 Gstack** | Mobile/kiosk incident reporting, report-on-behalf, supervisor classification review, unique incident ID, upload failure handling |
| **Group-3 BMAD** | Bangla-first quick reporting, minimal fields, offline queue, guest/anonymous reporting, QR-assisted context, post-submission evidence, simplified worker status |
| **Group-5 Superpowers** | Worker reporting journey, confidential reporting, rejection/dispute handling, audit integrity, compliance-sensitive reporter privacy |