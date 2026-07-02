using FactoryShield.Application.Capa.Models;
using MediatR;

namespace FactoryShield.Application.Capa.Queries;

public record GetCorrectiveActionsQuery(Guid IncidentId) : IRequest<IReadOnlyList<CorrectiveActionDto>>;
