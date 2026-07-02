namespace FactoryShield.Domain.Entities;

/// <summary>
/// Immutable append-only audit row written on every incident state change, decision,
/// claim, escalation, merge, and approval event (FS-23).
/// DB-level REVOKE UPDATE/DELETE is applied in migration AddSprint8.
/// </summary>
public class IncidentStateLog
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    /// <summary>STATE_CHANGE | CLAIM | CLAIM_RELEASE | DECISION | ESCALATION | APPROVAL | MERGE | REASSIGN | INFO_REQUEST | INFO_PROVIDED</summary>
    public string EventType { get; set; } = string.Empty;

    public string? FromStatus { get; set; }
    public string? ToStatus { get; set; }

    public Guid? ActorId { get; set; }
    public User? Actor { get; set; }
    public string? ActorRole { get; set; }

    public string? Description { get; set; }

    /// <summary>Before-value for reclassification or other field changes.</summary>
    public string? PreviousValue { get; set; }
    /// <summary>After-value for reclassification or other field changes.</summary>
    public string? NewValue { get; set; }

    /// <summary>PUBLIC = Reporter can see | INTERNAL = Staff only | RESTRICTED = Compliance Officer only</summary>
    public string VisibilityScope { get; set; } = "INTERNAL";

    public DateTime CreatedAt { get; set; }
}
