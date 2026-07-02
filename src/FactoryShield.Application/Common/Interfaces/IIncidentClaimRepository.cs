using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IIncidentClaimRepository
{
    Task<IncidentClaim?> GetActiveByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task<IReadOnlyList<IncidentClaim>> GetActiveByIncidentIdsAsync(IReadOnlyCollection<Guid> incidentIds, CancellationToken ct = default);
    Task<IReadOnlyList<IncidentClaim>> GetExpiredClaimsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<IncidentClaim>> GetAllByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task AddAsync(IncidentClaim claim, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
