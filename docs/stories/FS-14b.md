# Story FS-14b: SLA Notifications (Hangfire)

**Status:** Done
**Epic source:** Epic 2 US-10 / Sprint 5
**Depends on:** FS-14 (Done)
**Blocks:** FS-15 (Escalation)

---

## Scope

This story delivers the Hangfire-based notification layer that was deferred from FS-14.
FS-14 built the SLA data model and client-side countdown UI. FS-14b adds the server-side
job that fires exactly-once staged notifications when SLA thresholds are crossed.

**Delivered here:** Hangfire setup + `SlaCheckJob` every 5 min + `Notifications` table.
**FS-15** (Escalation auto-trigger on breach) can now be built on top of this.

## Story

As an Approver / Resolver, I want the system to fire a warning when an SLA is at 50%,
a critical alert at 80%, and a breach record at 100%, so that I am notified before an
incident breaches its service-level target.

## Acceptance Criteria

1. A Hangfire background worker runs in-process with the API; its dashboard is accessible at `/hangfire` in development.
2. `SlaCheckJob` is registered as a recurring job running every 5 minutes (`*/5 * * * *` cron).
3. For each open `SlaClock`, the job computes elapsed fraction and fires:
   - `SLA_WARNING` at ≥ 50% elapsed (once per clock+stage — not repeated).
   - `SLA_CRITICAL` at ≥ 80% elapsed (once per clock+stage).
   - `SLA_BREACHED` at ≥ 100% elapsed (once per clock+stage); the clock's `StoppedAt` is set.
4. Duplicate notifications are prevented: `Notifications` table has a unique index on `(IncidentId, Stage, Type)`.
5. `Notifications` table persists each fired event with `IncidentId`, `Stage`, `Type`, `CreatedAt`.

## Tasks / Subtasks

### NuGet
- [x] `Hangfire.Core` 1.8.20 → `FactoryShield.Infrastructure`
- [x] `Hangfire.PostgreSql` 1.20.11 → `FactoryShield.Infrastructure`
- [x] `Hangfire.AspNetCore` 1.8.20 → `FactoryShield.Api`

### Domain
- [x] `Notification` entity — `Id`, `IncidentId`, `Stage`, `Type`, `CreatedAt`
- [x] `NotificationType` constants — `SLA_WARNING`, `SLA_CRITICAL`, `SLA_BREACHED`

### Application
- [x] `INotificationRepository` — `ExistsAsync`, `AddAsync`, `SaveChangesAsync`
- [x] `ISlaClockRepository.GetAllOpenAsync()` — new method for job use
- [x] `SlaCheckJob` — iterates all open clocks, fires exactly-once notifications per threshold

### Infrastructure
- [x] `NotificationConfiguration` — table `Notifications`, unique index on `(IncidentId, Stage, Type)`, FK cascade
- [x] `NotificationRepository`
- [x] `AppDbContext.Notifications` DbSet
- [x] Migration `AddNotifications` — created and applied

### API
- [x] `Program.cs` — Hangfire services registered with `UsePostgreSqlStorage`
- [x] `Program.cs` — `AddHangfireServer()` starts the background worker
- [x] `Program.cs` — `UseHangfireDashboard("/hangfire")` (dev-only, open auth)
- [x] `RecurringJob.AddOrUpdate<SlaCheckJob>` — `*/5 * * * *` cron
- [x] `INotificationRepository` + `SlaCheckJob` registered in DI

## Dev Notes

**Hangfire schema:** `Hangfire.PostgreSql` auto-creates its own schema (`hangfire.*`) on first
startup — no EF migration needed for Hangfire's own tables.

**Exactly-once guarantee:** `ExistsAsync` checks before insert; unique index is the safety net.
Race conditions between two job firings are prevented by the DB-level unique constraint.

**Clock auto-stop on breach:** When `SLA_BREACHED` fires, `StoppedAt` is set on the `SlaClock`.
This prevents the clock from appearing in future `GetAllOpenAsync` calls and avoids stale countdown
badges in the UI.

**SlaCheckJob is `Scoped`:** Registered as `AddScoped<SlaCheckJob>`. Hangfire resolves it via
ASP.NET Core's DI container, so EF Core's `DbContext` scoping works correctly.

## Definition of Done

- [x] `dotnet build` succeeds (all 4 projects)
- [x] Migration `AddNotifications` applied to PostgreSQL
- [x] API starts with Hangfire worker — `/hangfire` dashboard loads in browser
- [x] `SlaCheckJob` appears in Hangfire dashboard under Recurring Jobs
- [x] Status updated to Done
