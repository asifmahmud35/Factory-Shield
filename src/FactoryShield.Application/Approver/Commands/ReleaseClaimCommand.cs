using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Approver.Commands;

public record ReleaseClaimCommand(Guid IncidentId, Guid ReleasedById) : IRequest;

public class ReleaseClaimCommandHandler : IRequestHandler<ReleaseClaimCommand>
{
    private readonly IIncidentClaimRepository _claims;

    public ReleaseClaimCommandHandler(IIncidentClaimRepository claims) => _claims = claims;

    public async Task Handle(ReleaseClaimCommand request, CancellationToken cancellationToken)
    {
        var claim = await _claims.GetActiveByIncidentIdAsync(request.IncidentId, cancellationToken);
        if (claim is null) return; // already released — idempotent

        if (claim.ClaimedById != request.ReleasedById)
            throw new InvalidOperationException("You can only release your own claim.");

        claim.IsActive = false;
        await _claims.SaveChangesAsync(cancellationToken);
    }
}
