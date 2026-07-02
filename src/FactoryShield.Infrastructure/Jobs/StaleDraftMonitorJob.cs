using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;

namespace FactoryShield.Infrastructure.Jobs;

public class StaleDraftMonitorJob
{
    private readonly IOfflineDraftRepository _drafts;
    private readonly INotificationRepository _notifications;
    private readonly IIncidentStateLogger _logger;

    public StaleDraftMonitorJob(
        IOfflineDraftRepository drafts,
        INotificationRepository notifications,
        IIncidentStateLogger logger)
    {
        _drafts = drafts;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken ct)
    {
        var threshold = DateTime.UtcNow.AddHours(-24);
        var stale = await _drafts.GetStaleDraftsAsync(threshold, ct);

        // Only alert on drafts that have not yet been synced and haven't already been alerted
        var unsynced = stale
            .Where(d => d.SyncStatus is "Queued" or "SyncFailed" && d.AlertSentCount == 0)
            .ToList();

        foreach (var draft in unsynced)
        {
            // Write SUBMITTED_LOCAL governance log entry (Governance §8 blind-spot alert)
            await _logger.LogAsync(
                incidentId: Guid.Empty,
                eventType: "SUBMITTED_LOCAL",
                fromStatus: null,
                toStatus: "SubmittedLocal",
                actorId: draft.ReporterId,
                actorRole: "REPORTER",
                description: $"Stale offline draft detected — localDraftId={draft.LocalDraftId}, age={(DateTime.UtcNow - draft.LocalEventTime).TotalHours:F1}h",
                visibilityScope: "INTERNAL",
                ct: ct);

            // Notify Governance (once — AlertSentCount prevents re-alerting)
            await _notifications.AddAsync(new Notification
            {
                Id = Guid.NewGuid(),
                IncidentId = null,              // system alert — no incident
                RecipientRole = "ADMIN",
                Channel = "InApp",
                Subject = "Stale Offline Report",
                Body = $"An offline incident report submitted {(DateTime.UtcNow - draft.LocalEventTime).TotalHours:F0} hours ago has not yet synced. Reporter ID: {draft.ReporterId}",
                Stage = "SUBMITTED_LOCAL",
                Type = "ALERT",
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            }, ct);

            draft.AlertSentCount++;
        }

        if (unsynced.Count > 0)
            await _drafts.SaveChangesAsync(ct);
    }
}
