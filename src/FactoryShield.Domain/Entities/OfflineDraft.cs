namespace FactoryShield.Domain.Entities;

public class OfflineDraft
{
    public Guid Id { get; set; }
    public string LocalDraftId { get; set; } = string.Empty;
    public Guid? ServerIncidentId { get; set; }
    public Guid ReporterId { get; set; }
    public User Reporter { get; set; } = null!;
    public string PayloadJson { get; set; } = string.Empty;
    public string PayloadHash { get; set; } = string.Empty;
    public string SyncStatus { get; set; } = "Queued"; // Queued | Syncing | Synced | SyncFailed
    public int SyncAttemptCount { get; set; }
    public int AlertSentCount { get; set; }
    public DateTime LocalEventTime { get; set; }
    public DateTime? ServerReceivedAt { get; set; }
    public string? SyncErrorMessage { get; set; }
}
