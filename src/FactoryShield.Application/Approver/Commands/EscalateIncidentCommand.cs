using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using FactoryShield.Domain.Services;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record EscalateIncidentCommand(Guid IncidentId, string Reason, Guid EscalatedById) : IRequest;

public class EscalateIncidentCommandHandler : IRequestHandler<EscalateIncidentCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly IEscalationRepository _escalations;
    private readonly IUserRepository _users;
    private readonly IIncidentStateLogger _logger;
    private readonly INotificationDispatcher _dispatcher;
    private readonly IEscalationNotificationRecorder _escalationNotifications;

    public EscalateIncidentCommandHandler(
        IIncidentRepository incidents,
        IEscalationRepository escalations,
        IUserRepository users,
        IIncidentStateLogger logger,
        INotificationDispatcher dispatcher,
        IEscalationNotificationRecorder escalationNotifications)
    {
        _incidents = incidents;
        _escalations = escalations;
        _users = users;
        _logger = logger;
        _dispatcher = dispatcher;
        _escalationNotifications = escalationNotifications;
    }

    public async Task Handle(EscalateIncidentCommand request, CancellationToken cancellationToken)
    {
        if (request.Reason.Trim().Length < 10)
            throw new ArgumentException("Escalation reason must be at least 10 characters.");

        var incident = await _incidents.FindByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var terminal = new[] { IncidentStatus.Resolved, IncidentStatus.Closed, IncidentStatus.Rejected };
        if (terminal.Contains(incident.Status))
            throw new InvalidOperationException($"Cannot escalate an incident with status '{incident.Status}'.");

        if (incident.EscalationLevel >= EscalationPolicy.MaxLevel)
        {
            await HandleExhaustionAsync(incident, request.Reason.Trim(), cancellationToken);
            return;
        }

        incident.EscalationLevel++;

        var managers = await _users.GetByRoleAsync("ADMIN", cancellationToken);
        var escalatedTo = managers.Count > 0 ? managers[0] : null;

        await _escalations.AddAsync(new Escalation
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            Level = incident.EscalationLevel,
            EscalationType = "MANUAL",
            Reason = request.Reason.Trim(),
            EscalatedById = request.EscalatedById,
            EscalatedToId = escalatedTo?.Id,
            EscalatedAt = DateTime.UtcNow,
            Resolution = "OPEN"
        }, cancellationToken);

        await _incidents.SaveChangesAsync(cancellationToken);
        await _escalations.SaveChangesAsync(cancellationToken);

        await _logger.LogAsync(
            incidentId: incident.Id,
            eventType: "ESCALATION",
            fromStatus: null,
            toStatus: null,
            actorId: request.EscalatedById,
            actorRole: "APPROVER",
            description: $"Manual escalation to level {incident.EscalationLevel}: {request.Reason.Trim()}",
            ct: cancellationToken);

        var recipientLabel = escalatedTo?.Name ?? "APPROVER role";

        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: escalatedTo?.Id,
            RecipientRole: escalatedTo is null ? "APPROVER" : null,
            TriggerEvent: "ESCALATION",
            Title: $"Incident {incident.IncidentReference} escalated to Level {incident.EscalationLevel}",
            Message: $"{incident.IncidentReference} has been escalated. Reason: {request.Reason.Trim()}",
            DeepLinkPath: $"/approver/incidents/{incident.Id}",
            IncidentId: incident.Id,
            IdempotencyKey: $"escalation:{incident.Id}:L{incident.EscalationLevel}",
            Channels: ["InApp", "Email"]
        ), cancellationToken);

        await _escalationNotifications.RecordAsync(
            incident.Id,
            incident.IncidentReference,
            ruleId: null,
            ruleName: "Manual Escalation",
            via: "InApp",
            recipients: recipientLabel,
            ct: cancellationToken);
    }

    private async Task HandleExhaustionAsync(
        Incident incident, string reason, CancellationToken ct)
    {
        var existing = (await _escalations.GetByIncidentIdAsync(incident.Id, ct))
            .FirstOrDefault(e => e.EscalationExhausted);

        if (existing is null)
        {
            await _escalations.AddAsync(new Escalation
            {
                Id = Guid.NewGuid(),
                IncidentId = incident.Id,
                Level = incident.EscalationLevel,
                EscalationType = "MANUAL",
                Reason = $"Escalation exhausted — {reason}",
                EscalatedAt = DateTime.UtcNow,
                Resolution = "OPEN",
                EscalationExhausted = true,
                FallbackNotifiedRole = EscalationPolicy.FallbackRole,
                EscalationExhaustedAt = DateTime.UtcNow,
            }, ct);
            await _escalations.SaveChangesAsync(ct);
        }

        await _dispatcher.DispatchAsync(new NotificationRequest(
            RecipientUserId: null,
            RecipientRole: EscalationPolicy.FallbackRole,
            TriggerEvent: "ESCALATION_EXHAUSTED",
            Title: $"Escalation exhausted — {incident.IncidentReference}",
            Message: "Escalation exhausted — no further level configured.",
            DeepLinkPath: $"/approver/incidents/{incident.Id}",
            IncidentId: incident.Id,
            IdempotencyKey: $"escalation-exhausted:{incident.Id}",
            Channels: ["InApp", "Email"]
        ), ct);

        await _escalationNotifications.RecordAsync(
            incident.Id,
            incident.IncidentReference,
            ruleId: null,
            ruleName: "Escalation Exhausted",
            via: "InApp",
            recipients: EscalationPolicy.FallbackRole,
            ct: ct);
    }
}
