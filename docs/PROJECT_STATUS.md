# FactoryShield — Project Status

**As of:** 2026-07-01

This document tracks actually-delivered functionality. Use **`API_PLAN.md`** for endpoint-level detail and status per route.

---

## ✅ Completed (Backend API)

| Area | What's done |
|------|-------------|
| **Auth** | JWT login/logout/me, role-based policies (Reporter, Approver, Resolver, Governance, Admin, ComplianceOfficer) |
| **Incidents (Reporter)** | Create, list mine, attachments upload, provide-info, offline-sync (batch + status + failure persistence), actions summary |
| **Approver** | Queue, resolvers list, approve/reject, escalate (with exhaustion), claim/release, reassign, merge, request-info, acknowledge escalation, approval audit trail |
| **Resolver** | Assigned list, investigation workspace (open/get/save/block/checklist/attachments), RCA (GET/PUT/submit), CAPA CRUD, evidence upload, complete, resolve |
| **Admin / RBAC** | Roles CRUD, users list, role assignment, categories/subcategories, departments, severity/priority config, factories/lines, notification templates |
| **Escalation** | Active list, rules CRUD, notification history **with auto-recording on manual/SLA dispatch**, exhaustion + ADMIN fallback |
| **Analytics** | KPI, incident trend, department performance, severity distribution, recurring issues, root-cause distribution, closure rate, resolution time, PDF/Excel export |
| **Governance** | Dual-control approvals (incl. CAPA rejection count increment), executive dashboard, incident timeline, unmask reporter |
| **Compliance** | 7-panel dashboard, identity-access audit endpoint, watermarked PDF export |
| **Notifications** | In-app list, read/read-all, unread count, dispatcher (email/SMS dev stubs), SLA warnings via dispatcher, active-viewer suppression |
| **QR** | Anonymous scan context, admin list/create/update |
| **Background jobs** | Hangfire SLA check (fixed auto-escalate bug), claim release, stale draft monitor, notification reminders |
| **Database** | EF Core migrations through `AddAdminAnalyticsRcaModules`, dev seeder with demo users + master data |

---

## ✅ Completed (Frontend)

| Area | What's done |
|------|-------------|
| **Shell** | Angular app shell, role-based navigation, login (JWT) |
| **Reporter** | Incident report form, confirmation, my incidents, QR scan, offline sync badge |
| **Approver** | Queue and incident actions |
| **Resolver** | Investigation workspace, RCA UI, CAPA views |
| **Governance** | Executive dashboard (API wired) |
| **Admin / Escalation / Notifications / Analytics** | UI shells exist; several still use mock data (see gaps below) |

---

## ✅ Frontend wiring — now complete (verified 2026-07-02)

All feature pages consume the real API (mock data removed) and were verified in the browser:
Analytics, Notifications, Administration, Escalation (incl. live active-escalations + notification history), Compliance dashboard, Approval audit trail panel, CAPA (create/update/complete/evidence), Incident detail (card layout, real fields).

Two fixes landed during this pass:
- **Session persistence** — JWT now stored in `localStorage`; `restoreSession()` rehydrates + validates on boot, so a refresh / direct-URL no longer drops the user to `/login` (`auth.service.ts`).
- **Governance demo users** — seeder now inserts MANAGER / SAFETY_OFFICER / PLANT_MANAGER / COMPLIANCE_OFFICER users so escalations route to a real named manager and FS-30 acknowledge is usable (`DataSeeder.EnsureGovernanceUsersAsync`).

## ✅ Real-time notifications + E2E automation (2026-07-02)

- **SignalR push replaces 60s polling** — `NotificationHub` (`FactoryShield.Infrastructure/Realtime`) pushes new in-app notifications to the recipient's browser over `/hubs/notifications`; `NotificationDispatcher` calls `INotificationPusher` right after persisting each `InApp` notification. JWT is passed via `access_token` query string (`OnMessageReceived` in `Program.cs`) since the WebSocket handshake can't carry an Authorization header. Frontend: `notification.service.ts` now opens/closes the connection via `@microsoft/signalr`, driven by an `effect()` in `app.component.ts` watching `auth.isAuthenticated()` — so it reconnects right after an interactive login, not just after a page refresh.
- **Golden-path E2E suite** — `e2e/golden-path.spec.ts` (Playwright) drives Reporter → Approver → Resolver → RCA → CAPA → Resolve end-to-end against the real API and a real browser. Not yet wired into CI (no CI provider configured for this repo yet — see `e2e/README.md`). Run locally with `npm run test:e2e` (API must already be running on `:5263`; Playwright starts the Angular dev server itself).
- **Bug fixes found while wiring the above:**
  - `SaveRcaCommand` — `RootCauseStatement` (always sent by the frontend, often blank) was unconditionally overwriting a properly-filled `StructuredDescription`, making RCA submission impossible via the Structured tab on a fresh investigation. Now only overwrites when non-blank.
  - `incident-detail.component.ts` — the Investigation / Root Cause / History tabs and Edit/Close actions referenced class members that were never implemented (compiled fine only because of a stale `.angular` build cache masking it); now fully wired to the existing Investigation/RCA/Governance services.

## 🔲 Remaining / Partial

| Area | Gap |
|------|-----|
| **Frontend E2E in CI** | Golden-path suite exists and passes locally (`e2e/golden-path.spec.ts`) but isn't wired into a CI pipeline yet — repo has no CI provider configured. |
| **Production hardening** | Real Email/SMS providers (dev stubs today), Hangfire dashboard auth in prod, digest-batching verification |

---

## E2E Verification (2026-07-01)

API golden-path smoke test executed against running backend:

| Step | Result |
|------|--------|
| Reporter login + create incident | ✅ |
| Approver approve → assign resolver | ✅ (Submitted → Triaged → Assigned) |
| Resolver open investigation + checklist | ✅ (Assigned → InProgress on open) |
| RCA save + submit | ✅ |
| CAPA create + complete + summary | ✅ |
| Resolve incident (L3/L4) | ✅ |
| Analytics KPI + new endpoints | ✅ |
| Escalations active + notification recording | ✅ |
| Admin RBAC smoke | ✅ |
| Compliance export + identity audit | ✅ |
| Approval audit trail | ✅ |

**Bugs fixed during verification:** State-machine transitions on approve/investigate; SLA auto-escalate guard that blocked L1 escalation after breach notification.

---

## Note on other docs

`SPRINT_PLANNING.md` tracks sprint story completion. **`PROJECT_STATUS.md`** and **`API_PLAN.md`** reflect what is implemented and verified in the running application.

**Backend API surface is effectively complete (~98%).** Remaining work is primarily frontend wiring and production infrastructure.
