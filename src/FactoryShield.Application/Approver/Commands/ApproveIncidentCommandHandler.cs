using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using FactoryShield.Domain.Services;
using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public class ApproveIncidentCommandHandler : IRequestHandler<ApproveIncidentCommand, Unit>
{
    private readonly IIncidentRepository _incidents;
    private readonly IUserRepository _users;
    private readonly ISlaClockRepository _slaClocks;
    private readonly IIncidentStateMachine _stateMachine;
    private readonly IIncidentStateLogger _logger;
    private readonly INotificationDispatcher _dispatcher;

    public ApproveIncidentCommandHandler(
        IIncidentRepository incidents,
        IUserRepository users,
        ISlaClockRepository slaClocks,
        IIncidentStateMachine stateMachine,
        IIncidentStateLogger logger,
        INotificationDispatcher dispatcher)
    {
        _incidents = incidents;
        _users = users;
        _slaClocks = slaClocks;
        _stateMachine = stateMachine;
        _logger = logger;
        _dispatcher = dispatcher;
    }

    public async Task<Unit> Handle(ApproveIncidentCommand request, CancellationToken cancellationToken)
    {
        var incident = await _incidents.FindByIdAsync(request.IncidentId, cancellationToken);
        if (incident is null)
            throw new KeyNotFoundException($"Incident '{request.IncidentId}' not found.");

        var resolver = await _users.FindByIdWithRoleAsync(request.ResolverUserId, cancellationToken);
        if (resolver is null || resolver.Role.Code != "RESOLVER")
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure(nameof(request.ResolverUserId), "Resolver not found or not in the RESOLVER role.")
            });
        }

        var fromStatus = incident.Status.ToString();
        _stateMachine.Transition(incident, IncidentStatus.Triaged);
        _stateMachine.Transition(incident, IncidentStatus.Assigned);
        incident.AssignedResolverId = resolver.Id;
        incident.Decision = ApprovalDecision.Approve;

        var now = DateTime.UtcNow;
        var triageClock = await _slaClocks.GetActiveByIncidentIdAsync(incident.Id, cancellationToken);
        if (triageClock is not null)
            triageClock.StoppedAt = now;

        await _slaClocks.AddAsync(new SlaClock
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            Stage = SlaStage.Assignment,
            StartedAt = now,
            TargetMinutes = SlaPolicy.TargetMinutes(SlaStage.Assignment, incident.Severity)
        }, cancellationToken);

        await _incidents.SaveChangesAsync(cancellationToken);

        await _logger.LogAsync(
            incidentId: incident.Id,
            eventType: "DECISION",
            fromStatus: fromStatus,
            toStatus: IncidentStatus.Assigned.ToString(),
            actorId: request.ActorId,
            actorRole: "APPROVER",
            description: $"Approved — assigned to resolver {resolver.Email}",
            ct: cancellationToken);

        // FS-28: Notify the assigned resolver
        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: resolver.Id,
            RecipientRole: null,
            TriggerEvent: "ASSIGNMENT",
            Title: $"Incident {incident.IncidentReference} assigned to you",
            Message: $"You have been assigned incident {incident.IncidentReference} ({incident.Category}, Severity L{incident.Severity}).",
            DeepLinkPath: $"/resolver/incidents/{incident.Id}/investigation",
            IncidentId: incident.Id,
            IdempotencyKey: $"assignment:{incident.Id}:{resolver.Id}",
            Channels: ["InApp", "Email"]
        ), cancellationToken);

        return Unit.Value;
    }
}
