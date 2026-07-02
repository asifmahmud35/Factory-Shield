using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record RequestInfoCommand(Guid IncidentId, string Question, Guid RequestedById) : IRequest;

public class RequestInfoCommandHandler : IRequestHandler<RequestInfoCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;

    public RequestInfoCommandHandler(IIncidentRepository incidents, ISlaClockRepository slaClocks)
    {
        _incidents = incidents;
        _slaClocks = slaClocks;
    }

    public async Task Handle(RequestInfoCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question) || request.Question.Trim().Length < 10)
            throw new ArgumentException("Question must be at least 10 characters.");

        var incident = await _incidents.GetByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        if (incident.Status != IncidentStatus.Submitted)
            throw new InvalidOperationException("Can only request info on Submitted incidents.");

        incident.Status = IncidentStatus.PendingReporterInput;

        // Pause the active SLA clock
        var clock = await _slaClocks.GetActiveByIncidentIdAsync(request.IncidentId, cancellationToken);
        if (clock is not null && clock.PausedAt is null)
            clock.PausedAt = DateTime.UtcNow;

        await _incidents.SaveChangesAsync(cancellationToken);
        await _slaClocks.SaveChangesAsync(cancellationToken);
    }
}
