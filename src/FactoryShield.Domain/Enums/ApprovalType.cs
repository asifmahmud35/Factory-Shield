namespace FactoryShield.Domain.Enums;

/// <summary>
/// The four dual-control approval gates in the full governance pipeline (FS-21).
/// Each gate requires 2 distinct actors (SoD: same actor cannot approve two consecutive gates).
/// </summary>
public enum ApprovalType
{
    CloseInvestigation = 0, // Investigation → RcaReview
    RootCauseSignOff   = 1, // RcaReview → CapaExecution
    CapaVerification   = 2, // Verification → Resolved
    ResolutionFinal    = 3, // Resolved → Closed
}
