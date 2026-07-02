namespace FactoryShield.Domain.Entities;

public class Escalation
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public int Level { get; set; }

    /// <summary>MANUAL | SLA_AUTO</summary>
    public string EscalationType { get; set; } = string.Empty;

    public string? Reason { get; set; }

    /// <summary>Null for SLA_AUTO escalations (no human actor).</summary>
    public Guid? EscalatedById { get; set; }

    public DateTime EscalatedAt { get; set; }

    // ── Escalation exhaustion (FS-28 AC10) ───────────────────────────────────
    public bool EscalationExhausted { get; set; }
    public string? FallbackNotifiedRole { get; set; }
    public DateTime? EscalationExhaustedAt { get; set; }

    // ── Escalation lifecycle (FS-30) ─────────────────────────────────────────
    /// <summary>Manager user who owns this escalation.</summary>
    public Guid? EscalatedToId { get; set; }
    public User? EscalatedTo { get; set; }

    /// <summary>When the manager acknowledged the escalation.</summary>
    public DateTime? AcknowledgedAt { get; set; }

    /// <summary>OPEN | ACKNOWLEDGED | SELF_RESOLVED | REASSIGNED</summary>
    public string Resolution { get; set; } = "OPEN";
}
