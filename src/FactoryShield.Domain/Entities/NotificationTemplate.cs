namespace FactoryShield.Domain.Entities;

public class NotificationTemplate
{
    public Guid Id { get; set; }
    public string TriggerEvent { get; set; } = string.Empty;
    /// <summary>JSON array of channel names, e.g. ["Email","SMS"].</summary>
    public string ChannelsJson { get; set; } = "[]";
    public string SubjectTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
}
