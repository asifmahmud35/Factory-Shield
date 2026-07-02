namespace FactoryShield.Domain.Entities;

/// <summary>
/// Written whenever an authorized role unmasks a confidential reporter's identity (FS-24).
/// Append-only — DB-level REVOKE UPDATE/DELETE applied in migration AddSprint8.
/// </summary>
public class IdentityAccessAudit
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public Guid AccessedById { get; set; }
    public User AccessedBy { get; set; } = null!;

    public string AccessedByRole { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime AccessedAt { get; set; }
}
