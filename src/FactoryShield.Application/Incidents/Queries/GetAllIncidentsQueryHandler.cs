using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Queries;

public class GetAllIncidentsQueryHandler : IRequestHandler<GetAllIncidentsQuery, IReadOnlyList<IncidentSummaryDto>>
{
    private readonly IIncidentRepository _incidents;
    private readonly IConfidentialityService _confidentiality;

    public GetAllIncidentsQueryHandler(IIncidentRepository incidents, IConfidentialityService confidentiality)
    {
        _incidents = incidents;
        _confidentiality = confidentiality;
    }

    public async Task<IReadOnlyList<IncidentSummaryDto>> Handle(
        GetAllIncidentsQuery request, CancellationToken cancellationToken)
    {
        var incidents = await _incidents.GetAllAsync(cancellationToken);

        return incidents
            .Select(i => new IncidentSummaryDto(
                i.Id,
                i.IncidentReference,
                i.Category,
                i.Severity,
                DisplayStatusMapper.Map(i.Status),
                i.CreatedAt,
                IsConfidential: _confidentiality.IsConfidential(i),
                ReporterDisplay: _confidentiality.GetReporterDisplay(i, request.ViewerRole),
                Department: i.Department,
                AssignedToName: i.AssignedResolver?.Name,
                Area: i.ExactLocation,
                IncidentDate: i.IncidentOccurredAt ?? i.CreatedAt))
            .ToList();
    }
}
