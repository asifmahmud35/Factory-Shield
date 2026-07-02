using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Application.Incidents.Queries;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Approver.Queries;

public class GetApproverQueueQueryHandler : IRequestHandler<GetApproverQueueQuery, IReadOnlyList<IncidentSummaryDto>>
{
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;
    private readonly IIncidentClaimRepository _claims;
    private readonly IConfidentialityService _confidentiality;

    public GetApproverQueueQueryHandler(
        IIncidentRepository incidents,
        ISlaClockRepository slaClocks,
        IIncidentClaimRepository claims,
        IConfidentialityService confidentiality)
    {
        _incidents = incidents;
        _slaClocks = slaClocks;
        _claims    = claims;
        _confidentiality = confidentiality;
    }

    public async Task<IReadOnlyList<IncidentSummaryDto>> Handle(
        GetApproverQueueQuery request, CancellationToken cancellationToken)
    {
        var incidents = await _incidents.GetByStatusesAsync(
            new[] { IncidentStatus.Submitted, IncidentStatus.PendingReporterInput },
            cancellationToken);

        var ids = incidents.Select(i => i.Id).ToList();

        var clocks = await _slaClocks.GetActiveByIncidentIdsAsync(ids, cancellationToken);
        var clockByIncident = clocks.ToDictionary(c => c.IncidentId);

        var claims = await _claims.GetActiveByIncidentIdsAsync(ids, cancellationToken);
        var claimByIncident = claims.ToDictionary(c => c.IncidentId);

        return incidents
            .Select(i =>
            {
                clockByIncident.TryGetValue(i.Id, out var clock);
                claimByIncident.TryGetValue(i.Id, out var claim);
                return new IncidentSummaryDto(
                    i.Id,
                    i.IncidentReference,
                    i.Category,
                    i.Severity,
                    DisplayStatusMapper.Map(i.Status),
                    i.CreatedAt,
                    clock?.StartedAt,
                    clock?.TargetMinutes,
                    clock?.Stage,
                    claim?.ClaimedById,
                    claim?.ClaimedBy?.Email,
                    claim?.ExpiresAt,
                    IsConfidential: _confidentiality.IsConfidential(i),
                    ReporterDisplay: _confidentiality.GetReporterDisplay(i, "APPROVER"));
            })
            .ToList();
    }
}
