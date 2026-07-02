using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IRoutingLogRepository
{
    Task AddAsync(IncidentRoutingLog log, CancellationToken ct = default);
    Task<List<IncidentRoutingLog>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
