using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public record OpenInvestigationCommand(Guid IncidentId, Guid OpenedByUserId) : IRequest<Guid>;
