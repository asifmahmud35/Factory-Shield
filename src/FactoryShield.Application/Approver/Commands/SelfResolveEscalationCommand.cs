using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record SelfResolveEscalationCommand(
    Guid IncidentId,
    Guid ActorId
) : IRequest;

public class SelfResolveEscalationCommandHandler : IRequestHandler<SelfResolveEscalationCommand>
{
    private readonly IEscalationRepository _escalations;
    private readonly IIncidentStateLogger _logger;

    public SelfResolveEscalationCommandHandler(
        IEscalationRepository escalations,
        IIncidentStateLogger logger)
    {
        _escalations = escalations;
        _logger = logger;
    }

    public async Task Handle(SelfResolveEscalationCommand request, CancellationToken ct)
    {
        var escalations = await _escalations.GetByIncidentIdAsync(request.IncidentId, ct);
        var open = escalations
            .Where(e => e.Resolution is "OPEN" or "ACKNOWLEDGED")
            .OrderByDescending(e => e.EscalatedAt)
            .FirstOrDefault();

        if (open is null)
            return;

        open.Resolution = "SELF_RESOLVED";
        await _escalations.SaveChangesAsync(ct);

        await _logger.LogAsync(
            incidentId: request.IncidentId,
            eventType: "ESCALATION_SELF_RESOLVED",
            fromStatus: null,
            toStatus: null,
            actorId: request.ActorId,
            actorRole: "RESOLVER",
            description: "Escalation self-resolved via corrective action progress.",
            ct: ct);
    }
}
