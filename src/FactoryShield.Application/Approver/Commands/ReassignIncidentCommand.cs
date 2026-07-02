using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record ReassignIncidentCommand(
    Guid   IncidentId,
    string NewCategory,
    int    NewSeverity,
    string Reason,
    Guid   ChangedById) : IRequest;

public class ReassignIncidentCommandHandler : IRequestHandler<ReassignIncidentCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly IRoutingLogRepository _routingLog;

    public ReassignIncidentCommandHandler(
        IIncidentRepository incidents,
        IRoutingLogRepository routingLog)
    {
        _incidents  = incidents;
        _routingLog = routingLog;
    }

    public async Task Handle(ReassignIncidentCommand request, CancellationToken cancellationToken)
    {
        var incident = await _incidents.GetByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        if (incident.LoopGuardTriggered)
            throw new InvalidOperationException("Loop guard has been triggered. Reassignment is blocked pending Admin review.");

        if (incident.RouteCount >= 2)
        {
            incident.LoopGuardTriggered = true;
            await _incidents.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Maximum reassignments reached. Loop guard triggered; Admin has been notified.");
        }

        var log = new IncidentRoutingLog
        {
            Id               = Guid.NewGuid(),
            IncidentId       = request.IncidentId,
            PreviousCategory = incident.Category,
            NewCategory      = request.NewCategory,
            PreviousSeverity = incident.Severity,
            NewSeverity      = request.NewSeverity,
            ChangedById      = request.ChangedById,
            Reason           = request.Reason,
            ChangedAt        = DateTime.UtcNow
        };

        incident.Category   = request.NewCategory;
        incident.Severity   = request.NewSeverity;
        incident.RouteCount += 1;

        await _routingLog.AddAsync(log, cancellationToken);
        await _incidents.SaveChangesAsync(cancellationToken);
        await _routingLog.SaveChangesAsync(cancellationToken);
    }
}
