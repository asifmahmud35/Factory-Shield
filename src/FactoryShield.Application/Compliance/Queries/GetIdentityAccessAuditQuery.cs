using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Compliance.Models;
using MediatR;

namespace FactoryShield.Application.Compliance.Queries;

public record GetIdentityAccessAuditQuery(
    DateTime? From,
    DateTime? To,
    Guid? ActorId,
    Guid CurrentUserId
) : IRequest<IReadOnlyList<IdentityAccessAuditItem>>;

public class GetIdentityAccessAuditQueryHandler
    : IRequestHandler<GetIdentityAccessAuditQuery, IReadOnlyList<IdentityAccessAuditItem>>
{
    private readonly IIdentityAccessAuditRepository _repo;

    public GetIdentityAccessAuditQueryHandler(IIdentityAccessAuditRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<IdentityAccessAuditItem>> Handle(
        GetIdentityAccessAuditQuery request, CancellationToken ct)
    {
        var rows = await _repo.GetFilteredAsync(
            request.From, request.To, request.ActorId, request.CurrentUserId, ct);

        return rows.Select(a => new IdentityAccessAuditItem(
            a.AccessedBy?.Name ?? "Unknown",
            a.AccessedBy?.Role?.Code ?? a.AccessedByRole,
            a.Incident?.IncidentReference ?? a.IncidentId.ToString(),
            a.Reason ?? "No reason given",
            a.AccessedAt
        )).ToList();
    }
}
