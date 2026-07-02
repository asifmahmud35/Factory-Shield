using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Resolver.Commands;

public record ResolveIncidentCommand(Guid IncidentId, Guid? ActorId = null) : IRequest;

public class ResolveIncidentCommandHandler : IRequestHandler<ResolveIncidentCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly ICorrectiveActionRepository _actions;
    private readonly IInvestigationRepository _investigations;
    private readonly IIncidentStateMachine _stateMachine;
    private readonly IIncidentStateLogger _logger;

    public ResolveIncidentCommandHandler(
        IIncidentRepository incidents,
        ICorrectiveActionRepository actions,
        IInvestigationRepository investigations,
        IIncidentStateMachine stateMachine,
        IIncidentStateLogger logger)
    {
        _incidents = incidents;
        _actions = actions;
        _investigations = investigations;
        _stateMachine = stateMachine;
        _logger = logger;
    }

    public async Task Handle(ResolveIncidentCommand request, CancellationToken ct)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var actions = await _actions.GetByIncidentIdAsync(request.IncidentId, ct);
        if (actions.Count == 0)
            throw new InvalidOperationException(
                "At least one corrective action must exist before resolving an incident.");

        // Epic 2 Final US-2 AC3: root cause must be identified before resolve
        var investigation = await _investigations.FindByIncidentIdAsync(request.IncidentId, ct);
        if (investigation is not null && investigation.InvestigationStatus != "ROOT_CAUSE_IDENTIFIED")
            throw new InvalidOperationException(
                "Root cause must be identified before resolving. Set root_cause_code on the investigation first.");

        var fromStatus = incident.Status.ToString();

        // FS-20 severity routing: L1/L2 (severity ≤ 2) enter the full governance pipeline;
        // L3/L4 (severity > 2) resolve directly.
        var target = incident.Severity <= 2
            ? IncidentStatus.Investigation
            : IncidentStatus.Resolved;

        _stateMachine.Transition(incident, target);
        await _incidents.SaveChangesAsync(ct);

        await _logger.LogAsync(
            incidentId: incident.Id,
            eventType: "STATE_CHANGE",
            fromStatus: fromStatus,
            toStatus: target.ToString(),
            actorId: request.ActorId,
            actorRole: "RESOLVER",
            description: target == IncidentStatus.Investigation
                ? "Incident severity ≤ L2: routed to Investigation pipeline"
                : "Incident resolved (L3/L4 fast-track)",
            ct: ct);
    }
}
