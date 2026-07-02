using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using FluentValidation;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public class RejectIncidentCommandHandler : IRequestHandler<RejectIncidentCommand, Unit>
{
    private readonly IIncidentRepository _incidents;
    private readonly IIncidentStateMachine _stateMachine;
    private readonly IValidator<RejectIncidentCommand> _validator;
    private readonly IIncidentStateLogger _logger;

    public RejectIncidentCommandHandler(
        IIncidentRepository incidents,
        IIncidentStateMachine stateMachine,
        IValidator<RejectIncidentCommand> validator,
        IIncidentStateLogger logger)
    {
        _incidents = incidents;
        _stateMachine = stateMachine;
        _validator = validator;
        _logger = logger;
    }

    public async Task<Unit> Handle(RejectIncidentCommand request, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
            throw new ValidationException(validation.Errors);

        var incident = await _incidents.FindByIdAsync(request.IncidentId, cancellationToken);
        if (incident is null)
            throw new KeyNotFoundException($"Incident '{request.IncidentId}' not found.");

        var fromStatus = incident.Status.ToString();
        _stateMachine.Transition(incident, IncidentStatus.Rejected);
        incident.Decision = request.RejectType == RejectType.Hard
            ? ApprovalDecision.HardReject
            : ApprovalDecision.SoftReject;
        incident.RejectReason = request.Reason;

        await _incidents.SaveChangesAsync(cancellationToken);

        await _logger.LogAsync(
            incidentId: incident.Id,
            eventType: "DECISION",
            fromStatus: fromStatus,
            toStatus: IncidentStatus.Rejected.ToString(),
            actorId: request.ActorId,
            actorRole: "APPROVER",
            description: $"{request.RejectType} rejection: {request.Reason}",
            ct: cancellationToken);

        return Unit.Value;
    }
}
