namespace FactoryShield.Domain.Entities;

public class IncidentRoutingLog
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;
    public string PreviousCategory { get; set; } = string.Empty;
    public string NewCategory { get; set; } = string.Empty;
    public int PreviousSeverity { get; set; }
    public int NewSeverity { get; set; }
    public Guid ChangedById { get; set; }
    public User ChangedBy { get; set; } = null!;
    public string? Reason { get; set; }
    public DateTime ChangedAt { get; set; }
}
