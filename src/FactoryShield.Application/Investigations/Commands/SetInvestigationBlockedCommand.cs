using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Investigations.Commands;

public record SetInvestigationBlockedCommand(
    Guid IncidentId,
    Guid ActorId,
    string BlockReason
) : IRequest;

public class SetInvestigationBlockedCommandHandler : IRequestHandler<SetInvestigationBlockedCommand>
{
    private readonly IInvestigationRepository _investigations;
    private readonly IIncidentStateLogger _logger;

    public SetInvestigationBlockedCommandHandler(
        IInvestigationRepository investigations,
        IIncidentStateLogger logger)
    {
        _investigations = investigations;
        _logger = logger;
    }

    public async Task Handle(SetInvestigationBlockedCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.BlockReason) || request.BlockReason.Trim().Length < 10)
            throw new ArgumentException("Block reason must be at least 10 characters.");

        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        if (inv.InvestigationStatus == "ROOT_CAUSE_IDENTIFIED")
            throw new InvalidOperationException("Cannot block an investigation where root cause is already identified.");

        inv.InvestigationStatus = "BLOCKED";
        inv.UpdatedAt = DateTime.UtcNow;

        await _investigations.SaveChangesAsync(ct);

        await _logger.LogAsync(
            incidentId: request.IncidentId,
            eventType: "INVESTIGATION_BLOCKED",
            fromStatus: null,
            toStatus: null,
            actorId: request.ActorId,
            actorRole: "RESOLVER",
            description: $"Investigation blocked: {request.BlockReason.Trim()}",
            ct: ct);
    }
}
