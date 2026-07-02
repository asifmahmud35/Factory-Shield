namespace FactoryShield.Domain.Enums;

/// <summary>
/// Full 16-state machine per architecture.md §3 (canonical Governance Spec).
/// Route every status write through IIncidentStateMachine — never set Incident.Status directly.
/// </summary>
public enum IncidentStatus
{
    // ── Core flow (Sprint 0-4) ──────────────────────────────────────────────
    Submitted            = 0,
    Triaged              = 1,
    Assigned             = 2,
    InProgress           = 3,
    Resolved             = 4,
    Closed               = 5,
    Rejected             = 6,
    // ── Sprint 6 additions ──────────────────────────────────────────────────
    MergedClosed         = 7,  // FS-18: duplicate merged into another incident
    PendingReporterInput = 8,  // FS-19: Approver requested more info; SLA paused
    // ── Sprint 7: full 16-state governance pipeline (FS-20) ─────────────────
    Draft                = 9,  // pre-submission local draft
    SubmittedLocal       = 10, // offline draft not yet synced
    PendingEvidence      = 11, // Resolver waiting on more evidence from floor
    Investigation        = 12, // formal investigation phase (severity L1/L2)
    RcaReview            = 13, // root cause sign-off gate
    CapaExecution        = 14, // corrective actions being executed
    Verification         = 15, // CAPA verification gate
    Withdrawn            = 16, // Reporter withdrew the incident
    Reopened             = 17, // closed incident re-opened for re-investigation
}
