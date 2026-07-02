using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record ApproveIncidentCommand(
    Guid IncidentId,
    Guid ResolverUserId,
    Guid ActorId
) : IRequest<Unit>;
