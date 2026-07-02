namespace FactoryShield.Domain.Entities;

public class EscalationRule
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TriggerAfterMinutes { get; set; }
    /// <summary>JSON array of channel names.</summary>
    public string ChannelsJson { get; set; } = "[]";
    /// <summary>JSON array of recipient role names.</summary>
    public string RecipientsJson { get; set; } = "[]";
    public bool Active { get; set; } = true;
}
