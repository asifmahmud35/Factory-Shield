using FactoryShield.Application.Investigations.Models;
using MediatR;

namespace FactoryShield.Application.Investigations.Queries;

public record GetInvestigationQuery(Guid IncidentId) : IRequest<InvestigationWorkspaceDto>;
