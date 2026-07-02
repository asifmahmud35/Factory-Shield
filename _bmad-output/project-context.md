---
project_name: 'Factoryshield'
user_name: 'Asif'
date: '2026-07-02'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 24
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Frontend:** Angular 19.2.0 (standalone components only, no NgModules) · TypeScript 5.7.2 (`strict: true`, `strictTemplates: true`, `strictInjectionParameters: true`) · RxJS ~7.8 · zone.js ~0.15
**Charting:** Use `apexcharts` core library directly, imported and driven manually via `afterNextRender`/`effect()` — **not** `ng-apexcharts` (its peer-dependency requires Angular ≥20; this project is 19.2, so installing/using it breaks the build)
**Backend:** .NET 10 (`net10.0`) · EF Core 9.x + Npgsql 9.x (PostgreSQL) · Hangfire 1.8.20 (background jobs, Postgres storage) · JWT Bearer auth (`Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.9) · Swashbuckle 10.2.3
**Testing:** Playwright (`@playwright/test`) for E2E only — there are no backend or frontend unit test projects in this repo

## Critical Implementation Rules

### Language-Specific Rules

- Angular templates use the modern `@if` / `@for` control-flow syntax, not `*ngIf` / `*ngFor`.
- Component state is signal-based (`signal()`, `computed()`, `effect()`) — avoid introducing `BehaviorSubject`/manual change detection patterns where a signal fits.
- Backend commands/queries follow MediatR CQRS: every write is a `Command` + `CommandHandler`, every read is a `Query` + `QueryHandler` pair under `FactoryShield.Application/<Feature>/Commands|Queries/`.
- FluentValidation validators are registered **explicitly** in `Program.cs` (`AddScoped<IValidator<TCommand>, TValidator>()`), not via assembly scanning — every new validator needs a matching explicit registration line or it silently never runs.

### Framework-Specific Rules

- `Incident.Status` must never be assigned directly. All status transitions route through the injected `IIncidentStateMachine`, which enforces the legal-transition adjacency map and throws `InvalidOperationException` on illegal hops.
- Role-based access is double-gated by design: backend `[Authorize(Policy = "...")]` is the real security boundary; frontend route guards / `@if` conditionals are UX-only. **Every backend policy-gated endpoint must have a matching frontend gate**, or the unauthorized role gets a silent 403 (this exact bug has recurred: Analytics nav link, dashboard's `/approvals/pending` call). When adding a new role-gated endpoint, immediately check what UI calls it and gate that too.
- SignalR JWT auth is passed via query string (`?access_token=...`), not the `Authorization` header, because browser WebSocket handshakes cannot set custom headers.
- Sidebar navigation and role-guard sets must be kept in sync: `ANALYTICS_ROLES` / `GOVERNANCE_ROLES` style sets in the frontend must mirror the backend's `GovernanceOnly` policy role list exactly.

### Testing Rules

- No unit test projects exist (backend or frontend) — verification of behavior is done via manual Playwright scripts written ad hoc.
- Temporary Playwright specs used for one-off UI verification should be named with a leading underscore (e.g. `e2e/_capa_shot.spec.ts`) and **deleted after use**, along with `test-results/` and `playwright-report/`, so they don't pollute the committed `e2e/` suite.
- To compare implementation against a Figma/reference design, use Playwright to screenshot the live app (`page.screenshot({ fullPage: true })`) rather than guessing from code alone — visual claims should be verified, not assumed. Set an explicit tall `viewport` when `fullPage: true` doesn't capture the whole scrollable page.

### Code Quality & Style Rules

- Never fabricate data for fields the backend doesn't provide (e.g. `line`, `buyer`, `productionOrder` were requested but don't exist on `IncidentDetail`) — render a dash (`—`) instead of inventing plausible-looking values.
- GenieERP-derived design tokens are shared across resolver-facing components (Investigation Workspace, RCA, CAPA): `--red:#e11d2e`, `--red-dark:#c81625`, `--purple:#6d4ee0`, `--purple-dark:#5a3fd0`, `--green:#22a35e`, `--green-bg:#eafaf1`, `--orange:#f0a63a`, `--ink:#1a1d29`, `--ink-soft:#4b5060`, `--ink-faint:#8a8fa3`, `--border:#e7e9f0`, `--bg:#f5f6fa`. Reuse these instead of introducing new hex values for the same semantic color.
- No comments unless they explain a non-obvious WHY (a workaround, an invariant, a subtle bug fix) — never comments that restate what the code does.

### Development Workflow Rules

- The user frequently edits files concurrently in the IDE while an agent is also working. Always re-read a file immediately before editing it; if it changed since last read, treat that as the user's in-progress work — never revert or flag it, just adapt.
- Git commits are made only when explicitly requested by the user, never proactively after a fix.
- `dotnet run` must be restarted (kill the existing `FactoryShield.Api.exe` process) after backend code changes if a fix doesn't seem to take effect — the running process can be serving stale compiled code.
- Clear `frontend/.angular/cache` if the Angular build seems to hide real compile errors after a large concurrent edit.

### Critical Don't-Miss Rules

- EF Core cannot translate `Count(predicate)` inside a grouped `Select()` to SQL for Npgsql — project the needed columns to a list first via `ToListAsync()`, then group/count client-side in memory.
- Frontend DTOs sometimes send an always-present-but-often-blank field (e.g. `RootCauseStatement` defaulting to `''`) that must **not** unconditionally overwrite a richer existing field (`StructuredDescription`) — guard writes with `!string.IsNullOrWhiteSpace(...)`.
- Don't add new sidebar/nav sections or extra buttons beyond what an approved reference design shows without checking first — prior extra sections (`Governance`, `Compliance` as separate groups) were added ahead of the reference mockup and later had to be merged/removed on request.
- When a screenshot comparison against a reference design reveals a functional element that has no reference-side equivalent (e.g. a "Mark Resolved" button, an embedded CAPA tracker), don't strip it purely for pixel-parity — check whether it's load-bearing for a real workflow requirement first (prior pattern: keep functionality, match visuals otherwise).

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-07-02
