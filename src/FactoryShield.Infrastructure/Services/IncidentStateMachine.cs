using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;

namespace FactoryShield.Infrastructure.Services;

/// <summary>
/// Full 16-state implementation per architecture.md §3 (FS-20).
/// Legal transitions are modelled as an adjacency map. Dual-control gates are
/// enforced by SubmitApprovalCommandHandler — the machine just validates the hop.
/// </summary>
public class IncidentStateMachine : IIncidentStateMachine
{
    private static readonly Dictionary<IncidentStatus, IncidentStatus[]> _allowed = new()
    {
        // ── Pre-submission ──────────────────────────────────────────────────
        [IncidentStatus.Draft]               = [IncidentStatus.SubmittedLocal],
        [IncidentStatus.SubmittedLocal]      = [IncidentStatus.Submitted],

        // ── Core approval flow ──────────────────────────────────────────────
        [IncidentStatus.Submitted]           = [IncidentStatus.Triaged,
                                                IncidentStatus.Rejected,
                                                IncidentStatus.MergedClosed,
                                                IncidentStatus.PendingReporterInput,
                                                IncidentStatus.Withdrawn],
        [IncidentStatus.PendingReporterInput]= [IncidentStatus.Submitted],
        [IncidentStatus.Triaged]             = [IncidentStatus.Assigned,
                                                IncidentStatus.Rejected,
                                                IncidentStatus.Withdrawn],
        [IncidentStatus.Assigned]            = [IncidentStatus.InProgress,
                                                IncidentStatus.Rejected],

        // ── Resolver work ───────────────────────────────────────────────────
        // InProgress → Investigation (L1/L2, full pipeline)
        // InProgress → Resolved     (L3/L4, skip pipeline)
        [IncidentStatus.InProgress]          = [IncidentStatus.PendingEvidence,
                                                IncidentStatus.Investigation,
                                                IncidentStatus.Resolved,
                                                IncidentStatus.Rejected],
        [IncidentStatus.PendingEvidence]     = [IncidentStatus.InProgress],

        // ── Full governance pipeline (Sprint 7, FS-20) ─────────────────────
        [IncidentStatus.Investigation]       = [IncidentStatus.RcaReview,   // CloseInvestigation gate passes
                                                IncidentStatus.Withdrawn],
        [IncidentStatus.RcaReview]           = [IncidentStatus.CapaExecution, // RootCauseSignOff gate passes
                                                IncidentStatus.Investigation], // RootCauseSignOff rejected
        [IncidentStatus.CapaExecution]       = [IncidentStatus.Verification],
        [IncidentStatus.Verification]        = [IncidentStatus.Resolved,      // CapaVerification gate passes
                                                IncidentStatus.CapaExecution], // CapaVerification rejected

        // ── Closure ─────────────────────────────────────────────────────────
        [IncidentStatus.Resolved]            = [IncidentStatus.Closed,        // ResolutionFinal gate passes
                                                IncidentStatus.Reopened],
        [IncidentStatus.Closed]              = [IncidentStatus.Reopened],
        [IncidentStatus.Reopened]            = [IncidentStatus.Investigation],

        // ── Terminal states ─────────────────────────────────────────────────
        [IncidentStatus.MergedClosed]        = [],
        [IncidentStatus.Rejected]            = [],
        [IncidentStatus.Withdrawn]           = [],
    };

    public void Transition(Incident incident, IncidentStatus targetState)
    {
        if (!_allowed.TryGetValue(incident.Status, out var allowed) ||
            !allowed.Contains(targetState))
        {
            throw new InvalidOperationException(
                $"Invalid state transition: {incident.Status} → {targetState}");
        }

        incident.Status = targetState;
    }
}
