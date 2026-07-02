using FactoryShield.Application.Capa.Models;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Capa.Queries;

public class GetCorrectiveActionsQueryHandler
    : IRequestHandler<GetCorrectiveActionsQuery, IReadOnlyList<CorrectiveActionDto>>
{
    private readonly ICorrectiveActionRepository _repo;

    public GetCorrectiveActionsQueryHandler(ICorrectiveActionRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<CorrectiveActionDto>> Handle(
        GetCorrectiveActionsQuery request, CancellationToken cancellationToken)
    {
        var actions = await _repo.GetByIncidentIdAsync(request.IncidentId, cancellationToken);
        return actions.Select(ToDto).ToList();
    }

    internal static CorrectiveActionDto ToDto(Domain.Entities.CorrectiveAction a) => new(
        a.Id, a.IncidentId, a.Title, a.Description, a.Owner, a.DueDate,
        a.Priority, a.CompletionPercentage, a.Status, a.VerifiedBy, a.CreatedAt, a.UpdatedAt
    );
}
