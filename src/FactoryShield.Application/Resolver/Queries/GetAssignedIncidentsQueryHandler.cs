using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using FactoryShield.Application.Incidents.Queries;
using MediatR;

namespace FactoryShield.Application.Resolver.Queries;

public class GetAssignedIncidentsQueryHandler
    : IRequestHandler<GetAssignedIncidentsQuery, IReadOnlyList<IncidentSummaryDto>>
{
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;

    public GetAssignedIncidentsQueryHandler(IIncidentRepository incidents, ISlaClockRepository slaClocks)
    {
        _incidents = incidents;
        _slaClocks = slaClocks;
    }

    public async Task<IReadOnlyList<IncidentSummaryDto>> Handle(
        GetAssignedIncidentsQuery request, CancellationToken cancellationToken)
    {
        var incidents = await _incidents.GetByResolverAsync(request.ResolverId, cancellationToken);

        var clocks = await _slaClocks.GetActiveByIncidentIdsAsync(
            incidents.Select(i => i.Id).ToList(), cancellationToken);
        var clockByIncident = clocks.ToDictionary(c => c.IncidentId);

        return incidents
            .Select(i =>
            {
                clockByIncident.TryGetValue(i.Id, out var clock);
                return new IncidentSummaryDto(
                    i.Id,
                    i.IncidentReference,
                    i.Category,
                    i.Severity,
                    DisplayStatusMapper.Map(i.Status),
                    i.CreatedAt,
                    clock?.StartedAt,
                    clock?.TargetMinutes,
                    clock?.Stage);
            })
            .ToList();
    }
}
