namespace FactoryShield.Application.Compliance.Models;

// ── Panel A: Incident Pipeline ─────────────────────────────────────────────
public record IncidentPipelineItem(string Stage, int Count);

// ── Panel B: Investigation Methodology ────────────────────────────────────
public record MethodologyItem(string Methodology, int Count, bool RequiresWeeklyReview);

// ── Panel C: Overdue / Repeat-Failure CAPAs ───────────────────────────────
public record RepeatFailureCapaItem(
    string IncidentReference,
    string CapaTitle,
    int RejectionCount,
    int DaysOverdue,
    bool BlocksClosure
);

// ── Panel D: Identity Access Audit ────────────────────────────────────────
public record IdentityAccessAuditItem(
    string AccessorName,
    string AccessorRole,
    string IncidentReference,
    string Purpose,
    DateTime AccessedAt
);

// ── Panel E: Rejection Dispute Summary ────────────────────────────────────
public record RejectionDisputeItem(
    string IncidentReference,
    string RejectReason,
    string DisputeStatus,
    DateTime RejectedAt,
    bool ReopenedFromRejection
);

// ── Panel F: Loop Guard & Tiebreak Pending ────────────────────────────────
public record LoopGuardItem(
    string IncidentReference,
    int RerouteCount,
    int DaysStalled,
    bool TiebreakPending
);

// ── Panel G: Escalation Exhausted ─────────────────────────────────────────
public record EscalationExhaustedItem(
    string IncidentReference,
    string FallbackNotifiedRole,
    DateTime ExhaustedAt,
    double HoursElapsed
);

// ── Root ───────────────────────────────────────────────────────────────────
public record ComplianceDashboardDto(
    DateTime From,
    DateTime To,
    List<IncidentPipelineItem> PanelA_IncidentPipeline,
    List<MethodologyItem> PanelB_InvestigationMethodology,
    List<RepeatFailureCapaItem> PanelC_RepeatFailureCapa,
    List<IdentityAccessAuditItem> PanelD_IdentityAccessAudit,
    List<RejectionDisputeItem> PanelE_RejectionDispute,
    List<LoopGuardItem> PanelF_LoopGuard,
    List<EscalationExhaustedItem> PanelG_EscalationExhausted
);
