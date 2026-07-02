using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Queries;

public class GetMyIncidentsQueryHandler : IRequestHandler<GetMyIncidentsQuery, IReadOnlyList<IncidentSummaryDto>>
{
    private readonly IIncidentRepository _incidents;

    public GetMyIncidentsQueryHandler(IIncidentRepository incidents) => _incidents = incidents;

    public async Task<IReadOnlyList<IncidentSummaryDto>> Handle(
        GetMyIncidentsQuery request, CancellationToken cancellationToken)
    {
        var incidents = await _incidents.GetByReporterAsync(request.ReporterId, cancellationToken);

        return incidents
            .Select(i => new IncidentSummaryDto(
                i.Id,
                i.IncidentReference,
                i.Category,
                i.Severity,
                DisplayStatusMapper.Map(i.Status),
                i.CreatedAt,
                Department: i.Department,
                Area: i.ExactLocation,
                IncidentDate: i.IncidentOccurredAt ?? i.CreatedAt))
            .ToList();
    }
}
