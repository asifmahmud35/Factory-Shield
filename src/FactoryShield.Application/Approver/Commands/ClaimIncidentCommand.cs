using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record ClaimIncidentCommand(Guid IncidentId, Guid ClaimedById) : IRequest;

public class ClaimIncidentCommandHandler : IRequestHandler<ClaimIncidentCommand>
{
    private readonly IIncidentRepository _incidents;
    private readonly IIncidentClaimRepository _claims;
    private readonly IIncidentStateLogger _logger;

    public ClaimIncidentCommandHandler(
        IIncidentRepository incidents,
        IIncidentClaimRepository claims,
        IIncidentStateLogger logger)
    {
        _incidents = incidents;
        _claims    = claims;
        _logger    = logger;
    }

    public async Task Handle(ClaimIncidentCommand request, CancellationToken cancellationToken)
    {
        var exists = await _incidents.GetByIdAsync(request.IncidentId, cancellationToken);
        if (exists is null) throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var existing = await _claims.GetActiveByIncidentIdAsync(request.IncidentId, cancellationToken);
        if (existing is not null && existing.ClaimedById != request.ClaimedById)
            throw new InvalidOperationException("Incident is already claimed by another Approver.");

        if (existing is not null)
        {
            existing.ClaimedAt = DateTime.UtcNow;
            existing.ExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await _claims.SaveChangesAsync(cancellationToken);
            return;
        }

        await _claims.AddAsync(new IncidentClaim
        {
            Id          = Guid.NewGuid(),
            IncidentId  = request.IncidentId,
            ClaimedById = request.ClaimedById,
            ClaimedAt   = DateTime.UtcNow,
            ExpiresAt   = DateTime.UtcNow.AddMinutes(30),
            IsActive    = true
        }, cancellationToken);

        await _claims.SaveChangesAsync(cancellationToken);

        await _logger.LogAsync(
            incidentId: request.IncidentId,
            eventType: "CLAIM",
            fromStatus: null,
            toStatus: null,
            actorId: request.ClaimedById,
            actorRole: "APPROVER",
            description: "Incident claimed",
            ct: cancellationToken);
    }
}
