using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;

namespace FactoryShield.Application.Jobs;

/// <summary>
/// Runs every 15 minutes. Critical/High incidents notify Approvers immediately and
/// individually (see CreateIncidentCommandHandler); Medium/Low incidents are intentionally
/// held back and batched here into a single digest notification per run, so the Approver
/// queue isn't spammed one-notification-per-incident for low-priority submissions.
/// </summary>
public class LowPriorityDigestJob
{
    private const int LowPrioritySeverityFloor = 3; // 3 = Medium, 4 = Low
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(15);

    private readonly IIncidentRepository _incidents;
    private readonly INotificationDispatcher _dispatcher;

    public LowPriorityDigestJob(IIncidentRepository incidents, INotificationDispatcher dispatcher)
    {
        _incidents = incidents;
        _dispatcher = dispatcher;
    }

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var windowStart = now - Window;

        var submitted = await _incidents.GetByStatusAsync(IncidentStatus.Submitted, ct);
        var toDigest = submitted
            .Where(i => i.Severity >= LowPrioritySeverityFloor && i.CreatedAt >= windowStart && i.CreatedAt <= now)
            .OrderBy(i => i.CreatedAt)
            .ToList();

        if (toDigest.Count == 0) return;

        // Bucket the idempotency key to this 15-minute run so overlapping/retried executions
        // of the same scheduled window never send the digest twice.
        var bucketKey = now.ToString("yyyyMMddHHmm");
        var title = toDigest.Count == 1
            ? $"New incident: {toDigest[0].IncidentReference}"
            : $"{toDigest.Count} new Medium/Low priority incidents";

        var message = string.Join("; ", toDigest.Select(i => $"{i.IncidentReference} ({i.Category})"));

        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: null,
            RecipientRole: "APPROVER",
            TriggerEvent: "NEW_INCIDENT_DIGEST",
            Title: title,
            Message: message,
            DeepLinkPath: "/approver/queue",
            IncidentId: null,
            IdempotencyKey: $"digest:{bucketKey}",
            Channels: ["InApp"]
        ), ct);
    }
}
