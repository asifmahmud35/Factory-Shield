using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IIdentityAccessAuditRepository
{
    Task AddAsync(IdentityAccessAudit audit, CancellationToken ct);
    Task<List<IdentityAccessAudit>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct);
    Task<List<IdentityAccessAudit>> GetFilteredAsync(
        DateTime? from, DateTime? to, Guid? actorId, Guid excludeUserId, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
