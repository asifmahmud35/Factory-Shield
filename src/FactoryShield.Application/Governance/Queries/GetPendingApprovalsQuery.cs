using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Governance.Models;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Governance.Queries;

public record GetPendingApprovalsQuery : IRequest<IReadOnlyList<PendingApprovalDto>>;

public class GetPendingApprovalsQueryHandler
    : IRequestHandler<GetPendingApprovalsQuery, IReadOnlyList<PendingApprovalDto>>
{
    private static readonly string[] SevLabels = ["", "Critical", "High", "Medium", "Low"];

    /// <summary>Gate state → (approvalType enum name, display title). Order = pipeline order.</summary>
    private static readonly (IncidentStatus Status, string Type, string Title)[] Gates =
    [
        (IncidentStatus.Investigation, "CloseInvestigation", "Close Investigation"),
        (IncidentStatus.RcaReview,     "RootCauseSignOff",   "Root Cause Sign-off"),
        (IncidentStatus.Verification,  "CapaVerification",   "CAPA Verification"),
        (IncidentStatus.Resolved,      "ResolutionFinal",    "Incident Closure"),
    ];

    private readonly IIncidentRepository _incidents;

    public GetPendingApprovalsQueryHandler(IIncidentRepository incidents) => _incidents = incidents;

    public async Task<IReadOnlyList<PendingApprovalDto>> Handle(
        GetPendingApprovalsQuery request, CancellationToken ct)
    {
        var gateStatuses = Gates.Select(g => g.Status).ToArray();
        var incidents = await _incidents.GetByStatusesWithReporterAsync(gateStatuses, ct);

        return incidents
            .Select(i =>
            {
                var gate = Gates.First(g => g.Status == i.Status);
                var sevLabel = i.Severity is >= 1 and <= 4 ? SevLabels[i.Severity] : "Unknown";
                return new PendingApprovalDto(
                    i.Id,
                    i.IncidentReference,
                    i.Severity,
                    sevLabel,
                    gate.Type,
                    gate.Title,
                    i.ShortDescription,
                    i.Reporter?.Name,
                    i.CreatedAt);
            })
            .OrderBy(p => p.Severity)
            .ThenBy(p => p.SubmittedAt)
            .ToList();
    }
}
