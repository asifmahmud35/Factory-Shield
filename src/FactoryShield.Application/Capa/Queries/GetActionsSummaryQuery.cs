using FactoryShield.Application.Capa.Models;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Capa.Queries;

public record GetActionsSummaryQuery(Guid IncidentId) : IRequest<ActionsSummaryDto>;

public class GetActionsSummaryQueryHandler : IRequestHandler<GetActionsSummaryQuery, ActionsSummaryDto>
{
    private readonly ICorrectiveActionRepository _repo;

    public GetActionsSummaryQueryHandler(ICorrectiveActionRepository repo) => _repo = repo;

    public async Task<ActionsSummaryDto> Handle(GetActionsSummaryQuery request, CancellationToken cancellationToken)
    {
        var actions = await _repo.GetByIncidentIdAsync(request.IncidentId, cancellationToken);
        if (actions.Count == 0)
            return new ActionsSummaryDto(0, 0, 0, 0, 0);

        var open = actions.Count(a => a.Status.Equals("Open", StringComparison.OrdinalIgnoreCase));
        var inProgress = actions.Count(a => a.Status.Equals("InProgress", StringComparison.OrdinalIgnoreCase));
        var completed = actions.Count(a =>
            a.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
            a.Status.Equals("Verified", StringComparison.OrdinalIgnoreCase) ||
            a.CompletionPercentage >= 100);

        var overall = (int)Math.Round(actions.Average(a => a.CompletionPercentage));

        return new ActionsSummaryDto(actions.Count, inProgress, open, completed, overall);
    }
}
