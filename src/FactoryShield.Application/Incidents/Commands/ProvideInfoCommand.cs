using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Enums;
using MediatR;

namespace FactoryShield.Application.Incidents.Commands;

public record ProvideInfoCommand(Guid IncidentId, string Response, Guid RespondedById) : IRequest;

public class ProvideInfoCommandHandler : IRequestHandler<ProvideInfoCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly ISlaClockRepository _slaClocks;

    public ProvideInfoCommandHandler(IIncidentRepository incidents, ISlaClockRepository slaClocks)
    {
        _incidents = incidents;
        _slaClocks = slaClocks;
    }

    public async Task Handle(ProvideInfoCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Response))
            throw new ArgumentException("Response cannot be empty.");

        var incident = await _incidents.GetByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        if (incident.Status != IncidentStatus.PendingReporterInput)
            throw new InvalidOperationException("Incident is not awaiting Reporter input.");

        incident.Status = IncidentStatus.Submitted;

        // Resume the SLA clock — accumulate pause duration
        var clock = await _slaClocks.GetActiveByIncidentIdAsync(request.IncidentId, cancellationToken);
        if (clock is not null && clock.PausedAt is not null)
        {
            var pausedMinutes = (int)(DateTime.UtcNow - clock.PausedAt.Value).TotalMinutes;
            clock.AccumulatedPauseMinutes += pausedMinutes;
            clock.PausedAt = null;
        }

        await _incidents.SaveChangesAsync(cancellationToken);
        await _slaClocks.SaveChangesAsync(cancellationToken);
    }
}
