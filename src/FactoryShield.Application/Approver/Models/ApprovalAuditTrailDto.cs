namespace FactoryShield.Application.Approver.Models;

/// <summary>
/// One approval-gate vote in the dual-control chain (FS-29).
/// </summary>
public record ApprovalChainEntryDto(
    string Gate,
    int ApprovalLevelAtAction,
    string ActorName,
    string ActorRole,
    bool IsApprove,
    string? RejectionReason,
    DateTime SubmittedAt
);

/// <summary>
/// A single claim/unclaim event from the Approver's claim history (FS-29).
/// </summary>
public record ClaimHistoryEntryDto(
    string ApproverName,
    string ApproverRole,
    DateTime ClaimedAt,
    DateTime ExpiresAt,
    bool IsActive,
    int DurationMinutes
);

/// <summary>
/// A category/severity reroute event (FS-17 routing log), surfaced in the audit trail.
/// </summary>
public record RoutingEventDto(
    string PreviousCategory,
    string NewCategory,
    int PreviousSeverity,
    int NewSeverity,
    string ChangedByName,
    string? Reason,
    DateTime ChangedAt,
    bool TriggeredLoopGuard
);

/// <summary>
/// Immutable approval-chain audit trail for one incident (FS-29 / Approver PRD US-11).
/// </summary>
public record ApprovalAuditTrailDto(
    Guid IncidentId,
    string IncidentReference,
    int CurrentEscalationLevel,
    bool LoopGuardTriggered,
    int RouteCount,
    List<ApprovalChainEntryDto> ApprovalChain,
    List<ClaimHistoryEntryDto> ClaimHistory,
    List<RoutingEventDto> RoutingEvents
);
