namespace FactoryShield.Domain.Entities;

public class EscalationNotificationRecord
{
    public Guid Id { get; set; }
    public Guid? IncidentId { get; set; }
    public Guid? RuleId { get; set; }
    public string IncidentReference { get; set; } = string.Empty;
    public string RuleName { get; set; } = string.Empty;
    public string Via { get; set; } = string.Empty;
    public string Recipients { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public string Status { get; set; } = "Delivered";
}
