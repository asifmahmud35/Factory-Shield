using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Rca.Models;
using MediatR;

namespace FactoryShield.Application.Rca.Queries;

public record GetSimilarIncidentsForRcaQuery(Guid IncidentId, Guid ResolverId) : IRequest<IReadOnlyList<SimilarIncidentDto>>;

public class GetSimilarIncidentsForRcaQueryHandler
    : IRequestHandler<GetSimilarIncidentsForRcaQuery, IReadOnlyList<SimilarIncidentDto>>
{
    private readonly IIncidentRepository _incidents;

    public GetSimilarIncidentsForRcaQueryHandler(IIncidentRepository incidents) => _incidents = incidents;

    public async Task<IReadOnlyList<SimilarIncidentDto>> Handle(
        GetSimilarIncidentsForRcaQuery request, CancellationToken ct)
    {
        var current = await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var assigned = await _incidents.GetByResolverAsync(request.ResolverId, ct);
        var category = (current.Category ?? "").Trim().ToLowerInvariant();

        return assigned
            .Where(i => i.Id != current.Id)
            .Select(i =>
            {
                var otherCat = (i.Category ?? "").Trim().ToLowerInvariant();
                var match = 0;
                if (!string.IsNullOrEmpty(category) && otherCat == category) match = 85;
                else if (!string.IsNullOrEmpty(category) && category.Length >= 4
                         && otherCat.Contains(category[..4], StringComparison.Ordinal)) match = 60;
                else if (!string.IsNullOrEmpty(otherCat) && otherCat.Length >= 4 && category.Length >= 4
                         && category.Contains(otherCat[..4], StringComparison.Ordinal)) match = 55;

                return new SimilarIncidentDto(
                    i.IncidentReference,
                    i.ShortDescription,
                    i.Category,
                    i.CreatedAt,
                    match);
            })
            .Where(i => i.MatchPercent > 0)
            .OrderByDescending(i => i.MatchPercent)
            .ThenByDescending(i => i.CreatedAt)
            .Take(5)
            .ToList();
    }
}
