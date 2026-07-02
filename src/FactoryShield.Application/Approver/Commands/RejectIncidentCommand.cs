using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public enum RejectType
{
    Soft,
    Hard
}

public record RejectIncidentCommand(
    Guid IncidentId,
    RejectType RejectType,
    string Reason,
    Guid? ActorId = null
) : IRequest<Unit>;
