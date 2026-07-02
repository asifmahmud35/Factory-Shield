namespace FactoryShield.Domain.Entities;

public class IncidentClaim
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;
    public Guid ClaimedById { get; set; }
    public User ClaimedBy { get; set; } = null!;
    public DateTime ClaimedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}
