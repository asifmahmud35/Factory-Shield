namespace FactoryShield.Application.Governance.Models;

/// <summary>
/// One incident sitting at a dual-control approval gate (FS-21), projected for the
/// Approvals page. The gate/title is derived from the incident's canonical status.
/// </summary>
public record PendingApprovalDto(
    Guid IncidentId,
    string IncidentReference,
    int Severity,
    string SeverityLabel,
    string ApprovalType,   // enum name, e.g. "CapaVerification" — sent back on the vote
    string ApprovalTitle,  // display label, e.g. "CAPA Verification"
    string Title,          // incident short description
    string? SubmittedBy,   // reporter name (or null / masked)
    DateTime SubmittedAt,
    int ApproveVotes,      // approvals already cast on the active gate by other approvers
    int RequiredApprovals  // dual-control threshold (2)
);
