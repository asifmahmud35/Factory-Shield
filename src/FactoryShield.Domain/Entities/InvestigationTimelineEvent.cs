namespace FactoryShield.Domain.Entities;

public class InvestigationTimelineEvent
{
    public Guid Id { get; set; }

    public Guid InvestigationId { get; set; }
    public Investigation Investigation { get; set; } = null!;

    public string EventType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public Guid? ActorId { get; set; }
}
