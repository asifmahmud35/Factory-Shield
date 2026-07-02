namespace FactoryShield.Domain.Entities;

public class SeverityLevel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = "#64748b";
    public int SlaHours { get; set; }
    public bool AutoEscalate { get; set; }
    /// <summary>Maps to Incident.Severity int (1-4).</summary>
    public int SeverityValue { get; set; }
}
