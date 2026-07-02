namespace FactoryShield.Domain.Entities;

public class PriorityLevel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = "#64748b";
    /// <summary>Maps to CorrectiveAction.Priority int (1-4).</summary>
    public int PriorityValue { get; set; }
}
