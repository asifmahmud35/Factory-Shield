using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using FactoryShield.Domain.Services;

namespace FactoryShield.Application.Jobs;

/// <summary>
/// Runs every 5 minutes. For each open SLA clock, computes elapsed fraction and fires
/// exactly-once staged notifications:
///   &gt;= 50% → SLA_WARNING
///   &gt;= 80% → SLA_CRITICAL
///   &gt;= 100% → SLA_BREACHED + L1 auto-escalation
/// Also fires L2 auto-escalation (FS-30) when an escalation stays OPEN for &gt; 48 hours.
/// </summary>
public class SlaCheckJob
{
    private readonly ISlaClockRepository _clocks;
    private readonly INotificationRepository _notifications;
    private readonly IIncidentRepository _incidents;
    private readonly IEscalationRepository _escalations;
    private readonly INotificationDispatcher _dispatcher;
    private readonly IEscalationNotificationRecorder _escalationNotifications;

    public SlaCheckJob(
        ISlaClockRepository clocks,
        INotificationRepository notifications,
        IIncidentRepository incidents,
        IEscalationRepository escalations,
        INotificationDispatcher dispatcher,
        IEscalationNotificationRecorder escalationNotifications)
    {
        _clocks = clocks;
        _notifications = notifications;
        _incidents = incidents;
        _escalations = escalations;
        _dispatcher = dispatcher;
        _escalationNotifications = escalationNotifications;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var openClocks = await _clocks.GetAllOpenAsync(ct);
        var now = DateTime.UtcNow;

        foreach (var clock in openClocks)
        {
            if (clock.PausedAt is not null) continue;

            var elapsedMin = (now - clock.StartedAt).TotalMinutes - clock.AccumulatedPauseMinutes;
            var fraction = elapsedMin / clock.TargetMinutes;

            if (fraction >= 1.0)
            {
                await FireOnceAsync(clock, NotificationType.SlaBreached, fraction, ct);
                await AutoEscalateL1Async(clock, now, ct);
                clock.StoppedAt = now;
            }
            else if (fraction >= 0.8)
            {
                await FireOnceAsync(clock, NotificationType.SlaCritical, fraction, ct);
            }
            else if (fraction >= 0.5)
            {
                await FireOnceAsync(clock, NotificationType.SlaWarning, fraction, ct);
            }
        }

        await CheckStaleEscalationsAsync(now, ct);

        await _notifications.SaveChangesAsync(ct);
        await _escalations.SaveChangesAsync(ct);
        await _clocks.SaveChangesAsync(ct);
    }

    private async Task FireOnceAsync(SlaClock clock, string type, double fraction, CancellationToken ct)
    {
        var idempotencyKey = $"{clock.IncidentId}:{clock.Stage}:{type}";
        if (await _notifications.ExistsByIdempotencyKeyAsync(idempotencyKey, ct))
            return;

        var incident = await _incidents.FindByIdAsync(clock.IncidentId, ct);
        if (incident is null) return;

        var triggerEvent = type switch
        {
            NotificationType.SlaWarning  => "SLA_WARNING",
            NotificationType.SlaCritical => "SLA_CRITICAL",
            NotificationType.SlaBreached   => "SLA_BREACH",
            _ => type
        };

        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: incident.AssignedResolverId,
            RecipientRole: incident.AssignedResolverId is null ? "APPROVER" : null,
            TriggerEvent: triggerEvent,
            Title: $"SLA {type} — {incident.IncidentReference}",
            Message: $"SLA stage {clock.Stage} is at {fraction * 100:F0}% for {incident.IncidentReference}.",
            DeepLinkPath: $"/approver/incidents/{incident.Id}",
            IncidentId: incident.Id,
            IdempotencyKey: idempotencyKey,
            Channels: ["InApp", "Email"]
        ), ct);
    }

    private async Task AutoEscalateL1Async(SlaClock clock, DateTime now, CancellationToken ct)
    {
        var incident = await _incidents.FindByIdAsync(clock.IncidentId, ct);
        if (incident is null) return;

        var terminal = new[] { IncidentStatus.Resolved, IncidentStatus.Closed, IncidentStatus.Rejected };
        if (terminal.Contains(incident.Status)) return;

        // Guard: one SLA_AUTO escalation per clock stage breach
        var existing = await _escalations.GetByIncidentIdAsync(clock.IncidentId, ct);
        if (existing.Any(e => e.EscalationType == "SLA_AUTO"
                           && e.Reason != null
                           && e.Reason.Contains(clock.Stage, StringComparison.OrdinalIgnoreCase)))
            return;

        if (incident.EscalationLevel >= EscalationPolicy.MaxLevel)
        {
            await MarkExhaustedAsync(incident, ct);
            return;
        }

        incident.EscalationLevel++;

        await _escalations.AddAsync(new Escalation
        {
            Id = Guid.NewGuid(),
            IncidentId = clock.IncidentId,
            Level = incident.EscalationLevel,
            EscalationType = "SLA_AUTO",
            Reason = $"SLA breached for stage {clock.Stage} after {clock.TargetMinutes} minutes.",
            EscalatedById = null,
            EscalatedAt = now,
            Resolution = "OPEN"
        }, ct);

        await _incidents.SaveChangesAsync(ct);

        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: null,
            RecipientRole: "APPROVER",
            TriggerEvent: "ESCALATION",
            Title: $"SLA breach auto-escalation — {incident.IncidentReference}",
            Message: $"SLA breached at stage {clock.Stage}. Auto-escalated to L{incident.EscalationLevel}.",
            DeepLinkPath: $"/approver/incidents/{incident.Id}",
            IncidentId: incident.Id,
            IdempotencyKey: $"sla-auto-L1:{incident.Id}:{clock.Stage}",
            Channels: ["InApp", "Email"]
        ), ct);

        await _escalationNotifications.RecordAsync(
            incident.Id,
            incident.IncidentReference,
            ruleId: null,
            ruleName: "SLA Auto Escalation L1",
            via: "InApp",
            recipients: "APPROVER",
            ct: ct);
    }

    private async Task CheckStaleEscalationsAsync(DateTime now, CancellationToken ct)
    {
        var openClocks = await _clocks.GetAllOpenAsync(ct);
        var incidentIds = openClocks.Select(c => c.IncidentId).Distinct();

        foreach (var incidentId in incidentIds)
        {
            var escalations = await _escalations.GetByIncidentIdAsync(incidentId, ct);

            var staleL1 = escalations
                .Where(e => e.EscalationType == "SLA_AUTO"
                         && e.Resolution == "OPEN"
                         && e.EscalatedAt < now.AddHours(-48))
                .OrderByDescending(e => e.EscalatedAt)
                .FirstOrDefault();

            if (staleL1 is null) continue;

            var alreadyL2 = escalations.Any(e => e.Level > staleL1.Level && e.EscalationType == "SLA_AUTO");
            if (alreadyL2) continue;

            var incident = await _incidents.FindByIdAsync(incidentId, ct);
            if (incident is null) continue;

            var terminal = new[] { IncidentStatus.Resolved, IncidentStatus.Closed, IncidentStatus.Rejected };
            if (terminal.Contains(incident.Status)) continue;

            if (incident.EscalationLevel >= EscalationPolicy.MaxLevel)
            {
                await MarkExhaustedAsync(incident, ct);
                continue;
            }

            incident.EscalationLevel++;

            await _escalations.AddAsync(new Escalation
            {
                Id = Guid.NewGuid(),
                IncidentId = incidentId,
                Level = incident.EscalationLevel,
                EscalationType = "SLA_AUTO",
                Reason = "L1 escalation unacknowledged for 48 hours — auto-escalated to L2.",
                EscalatedById = null,
                EscalatedAt = now,
                Resolution = "OPEN"
            }, ct);

            await _incidents.SaveChangesAsync(ct);

            await _dispatcher.DispatchAsync(new NotificationRequest(
                RecipientUserId: null,
                RecipientRole: "ADMIN",
                TriggerEvent: "ESCALATION_L2",
                Title: $"Incident {incident.IncidentReference} auto-escalated to L2",
                Message: $"{incident.IncidentReference} escalation unacknowledged for 48h. Escalated to L2.",
                DeepLinkPath: $"/incidents/{incidentId}",
                IncidentId: incidentId,
                IdempotencyKey: $"sla-L2:{incidentId}",
                Channels: ["InApp", "Email"]
            ), ct);

            await _escalationNotifications.RecordAsync(
                incident.Id,
                incident.IncidentReference,
                ruleId: null,
                ruleName: "SLA Auto Escalation L2",
                via: "InApp",
                recipients: "ADMIN",
                ct: ct);
        }
    }

    private async Task MarkExhaustedAsync(Incident incident, CancellationToken ct)
    {
        var escalations = await _escalations.GetByIncidentIdAsync(incident.Id, ct);
        if (escalations.Any(e => e.EscalationExhausted)) return;

        await _escalations.AddAsync(new Escalation
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            Level = incident.EscalationLevel,
            EscalationType = "SLA_AUTO",
            Reason = "Escalation exhausted — no further level configured.",
            EscalatedAt = DateTime.UtcNow,
            Resolution = "OPEN",
            EscalationExhausted = true,
            FallbackNotifiedRole = EscalationPolicy.FallbackRole,
            EscalationExhaustedAt = DateTime.UtcNow,
        }, ct);
        await _escalations.SaveChangesAsync(ct);

        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: null,
            RecipientRole: EscalationPolicy.FallbackRole,
            TriggerEvent: "ESCALATION_EXHAUSTED",
            Title: $"Escalation exhausted — {incident.IncidentReference}",
            Message: "Escalation exhausted — no further level configured.",
            DeepLinkPath: $"/approver/incidents/{incident.Id}",
            IncidentId: incident.Id,
            IdempotencyKey: $"escalation-exhausted:{incident.Id}",
            Channels: ["InApp", "Email"]
        ), ct);

        await _escalationNotifications.RecordAsync(
            incident.Id,
            incident.IncidentReference,
            ruleId: null,
            ruleName: "Escalation Exhausted",
            via: "InApp",
            recipients: EscalationPolicy.FallbackRole,
            ct: ct);
    }
}
