using FactoryShield.Domain.Enums;

namespace FactoryShield.Domain.Entities;

public class Incident
{
    public Guid Id { get; set; }

    /// <summary>INC-{YYYY}-{NNNN} — unique per year, sequential.</summary>
    public string IncidentReference { get; set; } = string.Empty;

    /// <summary>
    /// Canonical MVP status. Always written through IIncidentStateMachine — never set directly.
    /// </summary>
    public IncidentStatus Status { get; set; }

    // ── Reporter identity ─────────────────────────────────────────────────────
    /// <summary>NULL for anonymous (not in MVP scope but field is nullable per architecture.md §4.2).</summary>
    public Guid? ReporterId { get; set; }
    public User? Reporter { get; set; }

    // ── Incident core fields (Epic 1 US-2) ───────────────────────────────────
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// 1 = CRITICAL (L1), 2 = HIGH (L2), 3 = MEDIUM (L3), 4 = LOW (L4).
    /// Defaults to 4 (LOW) per architecture.md §3.2 and story AC-2.
    /// </summary>
    public int Severity { get; set; } = 4;

    public string ShortDescription { get; set; } = string.Empty;

    /// <summary>
    /// Plain string, not a FK. Architecture.md §4.1 defines a full departments table
    /// but that is more structure than this MVP slice needs. Deviation documented.
    /// </summary>
    public string? Department { get; set; }

    /// <summary>Occupational Safety / Fire &amp; Explosion etc. — distinct from incident type (<see cref="Category"/>).</summary>
    public string? ClassificationCategory { get; set; }
    public string? SubCategory { get; set; }
    public string? Factory { get; set; }
    public string? Building { get; set; }
    public string? Floor { get; set; }
    /// <summary>Machine / equipment identifier (e.g. SWM-0042).</summary>
    public string? Equipment { get; set; }
    public string? ProductionOrder { get; set; }
    public string? Buyer { get; set; }
    public string? StyleNumber { get; set; }

    /// <summary>When the incident occurred (reporter-supplied); <see cref="CreatedAt"/> is server receipt time.</summary>
    public DateTime? IncidentOccurredAt { get; set; }

    // ── Reporter contact (optional override at submission time) ───────────────
    public string? ReporterName { get; set; }
    public string? EmployeeId { get; set; }
    public string? ReporterDepartment { get; set; }
    public string? ContactNumber { get; set; }

    // ── Incident detail (report-time) ─────────────────────────────────────────
    public string? Witnesses { get; set; }
    public string? ImmediateActionTaken { get; set; }
    public string? ExactLocation { get; set; }
    public string? GpsCoordinates { get; set; }
    public string? AiSummary { get; set; }

    public DateTime CreatedAt { get; set; }

    // ── Approver decision (FS-05) ─────────────────────────────────────────────
    /// <summary>Set when an Approver approves the incident; the Resolver it's handed off to.</summary>
    public Guid? AssignedResolverId { get; set; }
    public User? AssignedResolver { get; set; }

    /// <summary>Which decision the Approver made (Approve / SoftReject / HardReject). Null until decided.</summary>
    public ApprovalDecision? Decision { get; set; }

    /// <summary>Reason text for a reject decision. Null for approvals.</summary>
    public string? RejectReason { get; set; }

    // ── Escalation (FS-15) ───────────────────────────────────────────────────
    /// <summary>0 = not escalated; increments on each manual or SLA-auto escalation.</summary>
    public int EscalationLevel { get; set; }

    // ── Routing (FS-17) ──────────────────────────────────────────────────────
    /// <summary>How many times category/severity has been changed. Loop guard fires at ≥ 2.</summary>
    public int RouteCount { get; set; }
    public bool LoopGuardTriggered { get; set; }

    // ── Merge (FS-18) ────────────────────────────────────────────────────────
    /// <summary>When this incident is a duplicate, points to the primary it was merged into.</summary>
    public Guid? MergedIntoId { get; set; }
    public Incident? MergedInto { get; set; }

    // ── Confidentiality (FS-24) ──────────────────────────────────────────────
    /// <summary>normal | confidential | anonymous_guest</summary>
    public string ReportingMode { get; set; } = "normal";
    /// <summary>visible | masked | anonymous — controls how reporter identity renders to Approvers.</summary>
    public string ReporterVisibility { get; set; } = "visible";
    /// <summary>Reference token for anonymous reporters to check status without logging in.</summary>
    public Guid? AnonymousReferenceToken { get; set; }

    // ── QR Entry (FS-26) ─────────────────────────────────────────────────────
    /// <summary>manual | qr | api — how the report was initiated.</summary>
    public string SourceChannel { get; set; } = "manual";
    public Guid? QrCodeId { get; set; }
    public QrCode? QrCode { get; set; }
    public string? ManualOverrideReason { get; set; }
}
