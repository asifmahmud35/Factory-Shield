using FactoryShield.Domain.Entities;

namespace FactoryShield.Application.Common.Interfaces;

public interface IEscalationRepository
{
    Task AddAsync(Escalation escalation, CancellationToken ct = default);
    Task<Escalation?> FindByIdAsync(Guid escalationId, CancellationToken ct = default);
    Task<IReadOnlyList<Escalation>> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct = default);
    Task<IReadOnlyList<Escalation>> GetActiveAsync(CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
