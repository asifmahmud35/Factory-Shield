using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Governance.Commands;
using FactoryShield.Application.Governance.Models;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Governance.Queries;

/// <summary>
/// Gates awaiting THIS approver's vote. Excludes gates the actor already voted on
/// (their part is done — dual-control waits for a second approver) and gates the
/// actor is barred from by Separation of Duties (they approved the previous gate).
/// </summary>
public record GetPendingApprovalsQuery(Guid ActorId) : IRequest<IReadOnlyList<PendingApprovalDto>>;

public class GetPendingApprovalsQueryHandler
    : IRequestHandler<GetPendingApprovalsQuery, IReadOnlyList<PendingApprovalDto>>
{
    private static readonly string[] SevLabels = ["", "Critical", "High", "Medium", "Low"];

    /// <summary>Gate state → (approvalType enum name, display title). Order = pipeline order.</summary>
    private static readonly (IncidentStatus Status, ApprovalType Type, string Title)[] Gates =
    [
        (IncidentStatus.Investigation, ApprovalType.CloseInvestigation, "Close Investigation"),
        (IncidentStatus.RcaReview,     ApprovalType.RootCauseSignOff,   "Root Cause Sign-off"),
        (IncidentStatus.Verification,  ApprovalType.CapaVerification,   "CAPA Verification"),
        (IncidentStatus.Resolved,      ApprovalType.ResolutionFinal,    "Incident Closure"),
    ];

    private static readonly Dictionary<ApprovalType, ApprovalType?> PreviousGate = new()
    {
        [ApprovalType.CloseInvestigation] = null,
        [ApprovalType.RootCauseSignOff]   = ApprovalType.CloseInvestigation,
        [ApprovalType.CapaVerification]   = ApprovalType.RootCauseSignOff,
        [ApprovalType.ResolutionFinal]    = ApprovalType.CapaVerification,
    };

    private readonly IIncidentRepository _incidents;
    private readonly IApprovalEventRepository _events;

    public GetPendingApprovalsQueryHandler(IIncidentRepository incidents, IApprovalEventRepository events)
    {
        _incidents = incidents;
        _events = events;
    }

    public async Task<IReadOnlyList<PendingApprovalDto>> Handle(
        GetPendingApprovalsQuery request, CancellationToken ct)
    {
        var gateStatuses = Gates.Select(g => g.Status).ToArray();
        var incidents = await _incidents.GetByStatusesWithReporterAsync(gateStatuses, ct);
        if (incidents.Count == 0) return [];

        var allEvents = await _events.GetByIncidentIdsAsync(incidents.Select(i => i.Id).ToList(), ct);
        var eventsByIncident = allEvents.ToLookup(e => e.IncidentId);

        var result = new List<PendingApprovalDto>();
        foreach (var i in incidents)
        {
            var gate = Gates.First(g => g.Status == i.Status);
            var events = eventsByIncident[i.Id].ToList();

            // Actor already voted on the active gate → nothing left for them to do here.
            if (events.Any(e => e.ApprovalType == gate.Type && e.ActorId == request.ActorId))
                continue;

            // Separation of Duties: actor approved the previous gate → barred from this one.
            if (PreviousGate[gate.Type] is ApprovalType prev &&
                events.Any(e => e.ApprovalType == prev && e.ActorId == request.ActorId && e.IsApprove))
                continue;

            var sevLabel = i.Severity is >= 1 and <= 4 ? SevLabels[i.Severity] : "Unknown";
            result.Add(new PendingApprovalDto(
                i.Id,
                i.IncidentReference,
                i.Severity,
                sevLabel,
                gate.Type.ToString(),
                gate.Title,
                i.ShortDescription,
                i.Reporter?.Name,
                i.CreatedAt,
                events.Count(e => e.ApprovalType == gate.Type && e.IsApprove),
                SubmitApprovalCommandHandler.RequiredApprovals));
        }

        return result
            .OrderBy(p => p.Severity)
            .ThenBy(p => p.SubmittedAt)
            .ToList();
    }
}
