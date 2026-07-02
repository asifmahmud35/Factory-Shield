using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Rca.Commands;

public record SubmitRcaCommand(Guid IncidentId) : IRequest;

public class SubmitRcaCommandHandler : IRequestHandler<SubmitRcaCommand>
{
    private readonly IInvestigationRepository _investigations;

    public SubmitRcaCommandHandler(IInvestigationRepository investigations) => _investigations = investigations;

    public async Task Handle(SubmitRcaCommand request, CancellationToken cancellationToken)
    {
        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        if (inv.RcaStatus == "Submitted")
            throw new InvalidOperationException("RCA has already been submitted.");

        if (string.IsNullOrWhiteSpace(inv.ProblemStatement))
            throw new InvalidOperationException("Problem statement is required before submission.");

        if (string.IsNullOrWhiteSpace(inv.RootCauseDescription))
            throw new InvalidOperationException("Root cause statement is required before submission.");

        inv.RcaStatus = "Submitted";
        inv.RcaSubmittedAt = DateTime.UtcNow;
        inv.InvestigationStatus = "ROOT_CAUSE_IDENTIFIED";
        inv.InvestigationCompletedAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        await _investigations.SaveChangesAsync(cancellationToken);
    }
}
