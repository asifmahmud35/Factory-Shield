namespace FactoryShield.Domain.Entities;

public class InvestigationChecklistItem
{
    public Guid Id { get; set; }

    public Guid InvestigationId { get; set; }
    public Investigation Investigation { get; set; } = null!;

    public int SortOrder { get; set; }
    public string Label { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}
