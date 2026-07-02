using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Incidents.Queries;

public record GetMyIncidentsQuery(Guid ReporterId) : IRequest<IReadOnlyList<IncidentSummaryDto>>;
