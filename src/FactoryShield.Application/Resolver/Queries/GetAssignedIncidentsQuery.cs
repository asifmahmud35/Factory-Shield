using FactoryShield.Application.Incidents.Models;
using MediatR;

namespace FactoryShield.Application.Resolver.Queries;

public record GetAssignedIncidentsQuery(Guid ResolverId) : IRequest<IReadOnlyList<IncidentSummaryDto>>;
