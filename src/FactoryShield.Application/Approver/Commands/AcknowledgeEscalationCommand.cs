using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record AcknowledgeEscalationCommand(
    Guid IncidentId,
    Guid EscalationId,
    Guid ActorId,
    string ActorRole
) : IRequest;

public class AcknowledgeEscalationCommandHandler : IRequestHandler<AcknowledgeEscalationCommand>
{
    private readonly IEscalationRepository _escalations;
    private readonly IIncidentStateLogger _logger;

    public AcknowledgeEscalationCommandHandler(
        IEscalationRepository escalations,
        IIncidentStateLogger logger)
    {
        _escalations = escalations;
        _logger = logger;
    }

    public async Task Handle(AcknowledgeEscalationCommand request, CancellationToken ct)
    {
        var allowed = new[] { "ADMIN" };
        if (!allowed.Contains(request.ActorRole))
            throw new UnauthorizedAccessException("Only ADMIN can acknowledge an escalation.");

        var escalation = await _escalations.FindByIdAsync(request.EscalationId, ct)
            ?? throw new KeyNotFoundException($"Escalation {request.EscalationId} not found.");

        if (escalation.IncidentId != request.IncidentId)
            throw new KeyNotFoundException($"Escalation {request.EscalationId} does not belong to incident {request.IncidentId}.");

        if (escalation.Resolution != "OPEN")
            throw new InvalidOperationException($"Escalation is already in '{escalation.Resolution}' state.");

        escalation.AcknowledgedAt = DateTime.UtcNow;
        escalation.Resolution = "ACKNOWLEDGED";

        await _escalations.SaveChangesAsync(ct);

        await _logger.LogAsync(
            incidentId: request.IncidentId,
            eventType: "ESCALATION_ACKNOWLEDGED",
            fromStatus: null,
            toStatus: null,
            actorId: request.ActorId,
            actorRole: request.ActorRole,
            description: $"Escalation {request.EscalationId} acknowledged by {request.ActorRole}.",
            ct: ct);
    }
}
