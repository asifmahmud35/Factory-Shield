using FactoryShield.Application.Common.Interfaces;

namespace FactoryShield.Infrastructure.Jobs;

/// <summary>
/// Hangfire recurring job — every 15 minutes.
/// Sends a single reminder for unread InApp notifications older than reminder_interval_minutes (default 60).
/// Sets ReminderSent=true to prevent re-sending.
/// </summary>
public class NotificationReminderJob
{
    private readonly INotificationRepository _repo;
    private readonly INotificationDispatcher _dispatcher;
    private const int ReminderIntervalMinutes = 60;

    public NotificationReminderJob(
        INotificationRepository repo,
        INotificationDispatcher dispatcher)
    {
        _repo = repo;
        _dispatcher = dispatcher;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var threshold = DateTime.UtcNow.AddMinutes(-ReminderIntervalMinutes);
        var stale = await _repo.GetUnreadOlderThanAsync(threshold, ct);

        foreach (var notif in stale)
        {
            if (notif.RecipientId is null) continue;

            await _dispatcher.DispatchAsync(new NotificationRequest(
                RecipientUserId: notif.RecipientId,
                RecipientRole: null,
                TriggerEvent: "REMINDER",
                Title: $"Reminder: {notif.Subject ?? notif.Type}",
                Message: $"You have an unread notification: {notif.Body ?? notif.Type}",
                DeepLinkPath: notif.DeepLinkPath,
                IncidentId: notif.IncidentId,
                IdempotencyKey: $"reminder:{notif.Id}",
                Channels: ["Email"]
            ), ct);

            notif.ReminderSent = true;
        }

        if (stale.Count > 0)
            await _repo.SaveChangesAsync(ct);
    }
}
