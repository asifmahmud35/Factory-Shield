using FactoryShield.Domain.Enums;

namespace FactoryShield.Domain.Entities;

/// <summary>
/// Immutable record of one actor's approval or rejection vote at a governance gate (FS-21).
/// DB-level UPDATE/DELETE is revoked for the app role — rows are append-only.
/// Two APPROVE rows from distinct actors (SoD-checked) advance the pipeline.
/// </summary>
public class ApprovalEvent
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public ApprovalType ApprovalType { get; set; }

    public Guid ActorId { get; set; }
    public User Actor { get; set; } = null!;

    /// <summary>true = APPROVE, false = REJECT.</summary>
    public bool IsApprove { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime SubmittedAt { get; set; }
}
