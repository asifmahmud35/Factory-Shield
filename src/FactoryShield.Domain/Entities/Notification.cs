namespace FactoryShield.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }

    /// <summary>Null for system-level alerts not tied to a specific incident.</summary>
    public Guid? IncidentId { get; set; }
    public Incident? Incident { get; set; }

    /// <summary>SLA_WARNING | SLA_CRITICAL | SLA_BREACHED | ALERT | ASSIGNMENT | ESCALATION | APPROVAL_GATE</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>TRIAGE | ASSIGNMENT | RESOLUTION | QR_SCAN_ANOMALY | SUBMITTED_LOCAL</summary>
    public string Stage { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    // ── Recipient targeting ──────────────────────────────────────────────────
    /// <summary>Specific user recipient. Null when broadcasting to a role.</summary>
    public Guid? RecipientId { get; set; }
    /// <summary>Role-based broadcast target (e.g. GOVERNANCE). Used when RecipientId is null.</summary>
    public string? RecipientRole { get; set; }

    // ── Dispatch fields (FS-28) ──────────────────────────────────────────────
    public string? Channel { get; set; }        // InApp | Email | SMS
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public string? DeepLinkPath { get; set; }
    public string? TriggerEvent { get; set; }   // what caused this notification
    public string? IdempotencyKey { get; set; } // incidentId+eventType+clockPeriod dedup

    // ── Lifecycle ────────────────────────────────────────────────────────────
    public DateTime? SentAt { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string DeliveryStatus { get; set; } = "Pending"; // Pending | Sent | Failed
    public bool ReminderSent { get; set; }
}
